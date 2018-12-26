async function parseData(){

	var textPromise = fetch('testParse4.csv').then((data)=>data.text()).then((data)=>text = data);

	await textPromise;

	text = text.split('\n')
	text = text.map((d)=>{return d.replace(/"(\d*),(\d*)"/g, "$1$2")})
	firstDataStringIndex = text.findIndex((d)=>d.split(',')[0].trim() === 'Punjab')

	/*cols = {};
	for(var j = firstDataStringIndex - 1; j >= 0; j--){
		var columns = text[j].split(',');
		for(var k = 1; k < columns.length; k++){
			if(cols[k]){
				continue;
			}
			if(columns[k].trim()){
				cols[k] = columns[k].trim();
			}
		}
	}*/

	cols = getColsObj();

	//hArray = createHiearchy();
	hObj = getHObject();
	flatH = getFlatHObj();
	finalObj = {};
	finalObjArr = [];
	var currObj = finalObj;

	for(var i = firstDataStringIndex; i < text.length; i++){
		if(emptyRow(text[i])){
			continue;
		}

		var row = text[i].split(',');
		if(newObjectRequired(row)){
			var newObjName = row[0].trim();

			if(newObjName.length === 0){
				continue;
			}
			finalObj[newObjName] = {};
			finalObjArr.push(newObjName);
			currObj = finalObj[newObjName];
			currObj.edited = false;
		}else{
			var dataObjName = row[0].trim();

			currObj[dataObjName] = JSON.parse(JSON.stringify(hObj));
			currObj.edited = true;
			var currDataObj = currObj[dataObjName];

			for(var j in cols){
				var propName = cols[j];
				/*var index = 1;
				while(currDataObj[propName]){
					propName += index;
					index++;
				}

				var propVal = row[j];

				if(!propVal){
					continue;
				}
				currDataObj[propName] = propVal;*/
				var path = getPropPath(flatH, propName, []);
				var pointer = currDataObj;
				for(var p = 0; p < path.length - 1; p++){
					pointer = pointer[path[p]];
				}

				var propVal = row[j];

				if(!propVal){
					continue;
				}
				pointer[path[path.length - 1]] = propVal;
			}
		}
	}

	//delete empty objects
	for(var i in finalObj){
		if(finalObj[i].hasOwnProperty('edited') && !finalObj[i].edited){
			delete finalObj[i];
		}
	}
}

function createRowDataObj(){
	var obj = hArray.concat([]).reverse().reduce((a,d)=>{
		d.forEach((e)=>{
			if(!e.parent) return;
			a[e.parent] = a[e.parent] || {};
		});

		return a;
	}, {});
}

function emptyRow(textString){
	var row = textString.split(',');
	var concat = row.reduce((a,d)=>a + d, '');

	return concat.length === 0;
}

function newObjectRequired(row){
	var concat = row.reduce((a,d)=>a + d, '');

	return concat.trim() === row[0].trim();
}

parseData();

function createHiearchy(){

	var hiearchyArr = [];
	var parentBounds = getObjBounds(text[1]);
	for(var i = 2 ; i < firstDataStringIndex; i++){
		var row = text[i];
		var objBounds = getObjBounds(row, parentBounds.end);
		console.log(objBounds);
		hiearchyArr.push(objBounds);
	}

	for(var i = hiearchyArr.length - 1; i > 0; i--){
		getParent(hiearchyArr[i], hiearchyArr[i - 1]);
	}

	return hiearchyArr;
}

function getParent(childRow, parentRow){
	parentRow = parentRow.concat([]).reverse();
	childRow.concat([]).reverse().forEach((d)=>{
		var start = d.start;
		var parent = parentRow.findIndex((e)=>e.start <= start);
		console.log(parent);
		if(parentRow[parent]){
			d.parent = parentRow[parent].name;
		}
	});
}

function getObjBounds(row, parentEnd){
	var boundArr = row.reduce((a,d,i)=>{
		if(d.trim().length > 0){
			var obj = {start : i,name : d.trim()};
			if(a.length){
				a[a.length - 1].end = i - 1;
			}

			a.push(obj);
		}
		return a;
	}
	,[]);

	boundArr[boundArr.length - 1].end = Math.min(row.length - 1, parentEnd);

	return boundArr;
}

function createHObject(arr,level,parent, ub,lb){
	if(level === arr.length){
		return;
	}

	var row = arr[level].split(',');
	var objectBounds = getObjBounds(row);
	console.log(objectBounds);

	for(var i = 0; i < objectBounds.length; i++){
		var propBounds = objectBounds[i];
		if(propBounds.start >= lb && propBounds.end <= ub){
			parent[propBounds.name] = {start : propBounds.start};
			createHObject(arr, level + 1, parent[propBounds.name], propBounds.end, propBounds.start);
		}
	}
}

function getHObject(){

	var root = {start : 0};
	var a = text.slice(1,firstDataStringIndex);
	createChildren(root, a, 0, 0, {});
	return root;
	
}

function createChildren(parent,arr,level,pStart,created){
	if(level === arr.length){
		return;
	}

	var row = arr[level].split(',');
	var objectBounds = getObjBounds(row);
	console.log(objectBounds);


	for(var i = objectBounds.length - 1; i >=0; i--){
		var propBounds = objectBounds[i];
		if(propBounds.start >= pStart && !created[level + '-' + i]){
			parent[propBounds.name] = {start : propBounds.start};
			created[level + '-' + i] = true;
			createChildren(parent[propBounds.name],arr, level + 1, propBounds.start, created);
		}
	}
}

function createLevelsArr(arr,level,pBounds,lArr){
	if(level === arr.length){
		return;
	}

	var row = arr[level].split(',');
	var objectBounds = getObjBounds(row);

	var currLevelArr = [];

	for(var i = objectBounds.length - 1; i >= 0; i--){
		var propBounds = objectBounds[i];
		var parentName = getParentName(pBounds, propBounds.start);
		currLevelArr.push({start : propBounds.start, name : propBounds.name, parent :parentName});
	}

	lArr.push(currLevelArr);

	createLevelsArr(arr, level + 1, objectBounds, lArr);
}

function getParentName(bounds, start){
	//find largest start val in bounds less than param start
	for(var i = bounds.length - 1; i >= 0; i--){
		if(bounds[i].start <= start){
			return bounds[i].name;
		}
	}

	console.log('not found', bounds, start);
}

function getHObject1(){
	var b = {};
	var a = text.slice(1,firstDataStringIndex);
	createHObject(a,0,b,a[0].split(',').length, 0);

	return b;
}

function getColsFromHObj(colsObj, hObj, parentName){
	for(var i in hObj){
		console.log(i);
		if(Object.keys(hObj[i]).length === 1){
			colsObj[hObj[i].start] = i;
		}else{
			getColsFromHObj(colsObj, hObj[i], i);
		}
	}
}

function getColsObj(){
	var colsObj = {};
	var hObj = getHObject();
	getColsFromHObj(colsObj, hObj, null);
	return colsObj;
}

function getFlatHiearchy(hObj, parentName, resObj){
	if(Object.keys(hObj).length === 1){
		return;
	}
	for(var i in hObj){
		resObj[i] = parentName;
		getFlatHiearchy(hObj[i], i, resObj);
	}
}

function getFlatHObj(){
	var fHObj = {};
	var hObj = getHObject();
	console.log(hObj);
	getFlatHiearchy(hObj, null, fHObj);
	return fHObj;
}

function getPropPath(fHObj, prop, arr){
	if(fHObj[prop] === null){
		arr.push(prop);
		return arr;
	}
	if(!fHObj[prop]){
		throw new Error('Prop not found' + prop);
	}
	getPropPath(fHObj, fHObj[prop], arr);
	arr.push(prop);
	return arr;
}

function createFullTree(){
	
	var a = text.slice(1,firstDataStringIndex);
	var lArr = [];
	createLevelsArr(a,0,[{name : null, start : 0}],lArr);

	console.log(lArr);

	var root = {start : 0};

	lArr[0].forEach((d)=>{
		root[d.name] = {start : d.start};
	});

	for(var i in root){
		createTree(root[i], i, lArr, 1);
	}

	return root;
}

function createTree(root,rootName,arr,level){
	if(level === arr.length){
		return;
	}

	var levelNodes = arr[level];
	for(var i = 0; i < levelNodes.length; i++){
		var node = levelNodes[i];
		if(node.parent === rootName){
			root[node.name] = {start : node.start};
			createTree(root[node.name], node.name, arr,level + 1);
		}
	}
}