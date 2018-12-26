async function parseData(){

	var textPromise = fetch('indicators1.csv').then((data)=>data.text()).then((data)=>text = data);

	await textPromise;

	originalText = text;
	text = text.split('\n')
	text = text.map((d)=>{return d.replace(/"(\d*),(\d*)"/g, "$1$2")})
	
	firstDataStringIndex = text.findIndex((d)=>d.split(',')[0].trim() === 'Punjab')
	rowDataObjProps = text.slice(1, firstDataStringIndex).map((d)=>d.split(','));
	colNum = text[firstDataStringIndex].split(',').length;
}

parseData();

function getRowBounds(row){
	var bounds = row.reduce((a,d,i) =>{
		var arr = a.arr;
		d = d.trim();
		if(d){
			if(a.length){
				a[a.length - 1].end = i - 1;
			}
			a.push({name : d, start : i})
		}
		return a;
	},  []);

	bounds[bounds.length - 1].end = row.length - 1;

	return bounds;
}

function getNextNonEmptyCell(start, arr){
	
	for(var i = start; i < arr.length && !arr[i].trim(); i++){
	}

	return i;
}

function fillEmptyProps(){
	return rowDataObjProps.map((d,i)=>{
		var arr = d.split(',');
		var firstNEIndex = getNextNonEmptyCell(0, arr);
		var prev = arr[firstNEIndex];
		for(i = firstNEIndex + 1 ; i < arr.length; i++){
			if(arr[i].trim()){
				prev = arr[i].trim();
			}
			arr[i] = prev; 
		}
		return arr;	
	});
}

function getColPathObj(arr, level, lb, ub, res){
	if(level === arr.length){
		return;
	}

	var row = arr[level]
	var currPropIndex = getNextNonEmptyCell(lb,row);

	while(currPropIndex < ub){
		console.log(currPropIndex);
		var endIndex = Math.min(getNextNonEmptyCell(currPropIndex + 1,row), ub);
		for(var j = currPropIndex; j < endIndex; j++){
			res[j] = res[j] || '';
			res[j] = res[j] + '__' + row[currPropIndex];
		}
		getColPathObj(arr, level + 1, currPropIndex, endIndex, res);
		currPropIndex = endIndex;
	}
	
}

function isEmptySection(lb,ub,arr){
	for(var i = lb; i < ub; i++){
		if(arr[i].trim()){
			return false;
		}
	}
	return true;
}

function findNextNonEmptySection(lb,ub,arr2d,start){
	//LI => arr2d[start..i][lb..ub] is empty
	for(var i = start; i < arr2d.length; i++){
		var innerArr = arr2d[i];
		if(!isEmptySection(lb,ub,innerArr)){
			return i;
		}
	}
	return -1;
}

function swapKApartArraySectionsIn2DArr(arr, k,lb,ub,start){
	//LI => arr[start..i - 1][lb..ub] swapped with arr[(0..i-1) + k][lb..ub]
	for(var i = start; i + k < arr.length; i++){
		swapArraySection(lb,ub,arr[i], arr[i + k]);
	}	
}

function swapArraySection(lb,ub,a1,a2){
	for(var i = lb; i < ub; i++){
		var temp = a1[i];
		a1[i] = a2[i];
		a2[i] = temp;
	}
}

function removeDataPropsArrGaps(){
	
}

function removeQuotes(){
	inQuotes = false;
	newString = '';
	//LI => newString contains all characters encountered so far other than \n
	//and , if they are surrounded by qoutes
	for(var i = 0; i < originalText.length; i++){
		if(originalText.charAt(i) === '"'){
		 	inQuotes = !inQuotes;
		}else{
			if(!inQuotes){
				newString += originalText.charAt(i);
			}
			else{
				if(!(originalText.charAt(i) === "," || originalText.charAt(i) === "\n")){
					newString += originalText.charAt(i);
				}
			}
		}
	}
}