/**
* QueryMed UI
*/

function searchSome(){
	$("#select-source").animate({"height": "toggle"}, { duration: 800 });
}

function optionclear(){
	$("#datasources > input").removeAttr("checked");
	$("#datasources :input:not(:checked)").each(function() {
		$('#selectors').find('#'+$(this).val()).remove();
	});
}

function addSource(){
	$("#add-source").dialog({
		width: 500,
	      position: ['center', 'top'],
	      buttons: { "Ok": function() {
			var s = $('#name').val();
			$('#datasources').append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  <input type="checkbox" value="'+s+'" id="'+s+'" name="'+s+'">'+s+'</input><br/>');
			dict[s] = $('#url').val();
			$(this).dialog("close"); 
			$(this).dialog("destroy");
	      }
	    } 
	  });
}

/*
 * Executes a SPARQL query based on the keyword given in the text box
 * The result set would be in JSON and will look like this:
 
 *  NOTE: Strictly no spaces in-between!
 *  
 * {
 *    "bindings":
 *    [
 *    	{"source" : "dailymed",
 *    	 "uri" : "http://dailymed",
 *    	 "vars" : ["name","indication"],
 *    	 "count":2,
 *    	 "results" : 
 *    		[
 *    			{"name": "Isosorbide (Tablet, Film Coated, Extended Release)", "indication":"Isosorbide Mononitrate ..."},
 *    			{"name": "Altace (Capsule)", "indication":"Reduction in Risk of Myocardial Infarction..."},
 *    		]
 *    	}
 *    	,
 *    	{"source" : "diseasome",
 *    	 "uri" : "http://diseasome",
 *    	 "vars" : ["disease"],
 *    	 "count":2,
 *    	 "results" : 
 *    		[
 *    			{"disease": "Coronary artery disease"},
 *    			{"disease": "Coronary artery disease, autosomal dominant, 1, 608320"}
     		]
 *    	}
 *    ]
 * }
 *
 */
function searchAll(){
	
//	var jsonObj = '{\n\
//		  "bindings":\n\
//			  [\n\
//			  	{"source" : "diseasome",\n\
//			  	 "uri" : "http://diseasome",\n\
//			  	 "vars" : ["disease"],\n\
//			  	 "count":2,\n\
//			  	 "results" : \n\
//			  		[\n\
//			  			{"disease": "disease1"},\n\
//			  			{"disease": "disease2"}\n\
//			     		]\n\
//			  	}\n\
//			  	,\n\
//			  	{"source" : "dailymed",\n\
//				  	 "uri" : "http://dailymed",\n\
//				  	 "vars" : ["name","indication","treatment"],\n\
//				  	 "count":3,\n\
//				  	 "results" : \n\
//				  		[\n\
//				  		 {"name":"name1","indication":"indication1", "treatment" : "treatment1" },\n\
//				  		 {"name":"name2","indication":"indication2", "treatment" : "treatment2"},\n\
//				  		 {"name":"name3","indication":"indication3", "treatment" : "treatment3"},\n\
//				  		]\n\
//				  	}\n\
//			  ]\n\
//		}';

	$("#ajax-wait-img").show();
	var keyword = $('#keyword').val();
	$.ajax({
		   url: "RunQuery",
		   processData: false,
		   data: "keyword="+keyword,
		   success: function(jsonObj){

				$("#ajax-wait-img").hide();
				//This loop is for all the endpoints that were queried

				var html = "";
				
				for (var i in $.evalJSON(jsonObj).bindings){
					
					var source = $.evalJSON(jsonObj).bindings[i].source;

					html += "<a href='#"+source+"'><h2>"+source+"</h2></a>";

					var vars = $.evalJSON(jsonObj).bindings[i].vars;
					var data = new Array($.evalJSON(jsonObj).bindings[i].count);
					
					
					for (var j in $.evalJSON(jsonObj).bindings[i].results){
						
						data[j] = new Array(vars.length);
						
						var resultObj = $.evalJSON(jsonObj).bindings[i].results[j];
						var resultStr = ($.toJSON(resultObj)).toString();
						
						//The following is a hack because, JSON does not allow to dynamically find the value for a property obtained from a variable
						//Assumption: the properties are in order
						var tokens = resultStr.tokenize(":", " ", true); //converts the comma seperated string into an array
						
						//Because of the nature of the JSON object we can always guarantee that the number 
						//of tokens is >= 2. 
						for (var t=1; t<tokens.length-1; t++){
							var tokenLen = tokens[t].length;
							for (var k in vars){
								var varLen = vars[k].length;
								//alert("token = "+tokens[t]+"\tlength = "+tokenLen+"\nvar = "+vars[k]+"\tlength = "+varLen+"\nsubStr = "+tokens[t].substr(tokenLen-varLen-1,varLen)+"\nsubStr matched = "+(tokens[t].substr(tokenLen-varLen-1,varLen) == vars[k]));
								if (tokens[t].substr(tokenLen-varLen-1,varLen) == vars[k]){
									tokens[t] = tokens[t].substr(1,tokenLen-varLen-5); //The -3 is to account for the trailing "s(quote signs), parenthesis, and the comma inbetween 
								}
							}
						}
						//Remove the parenthesis and the commas of last element:
						var lastIndex = tokens.length-1;
						var lastTokenLen = tokens[lastIndex].length;
						tokens[lastIndex] = tokens[lastIndex].substr(1,lastTokenLen-3);
						
						//Add the values to the data matrix, so that we can build the table
						for (var t=1; t<tokens.length; t++){
							data[j][t-1] = tokens[t]; 
						}
						
					}

					html += createDataTable(vars, data);

				}

				$('#dt_container').html(html);
				$("#dt_container").dialog("open");
				//@@TODO: I dunno why the last column is always smaller than the others - try to find a fix
				$('.dataTable').dataTable();
				$('.dataTable').css("width", "100%");
				
		   }
	});

}

/*
 * The datatable returned should be of the format used by the
 * datatables jquery plugin 
 */
function createDataTable(headers, data){
	
	var table = '<table cellpadding="0" cellspacing="0" border="0" class="display dataTable">';
	
	var tableHeader = '<tr>';
	for (var i=0; i<headers.length; i++){
		tableHeader += '<th>'+headers[i]+'</th>';
	}
	tableHeader += '</tr>';
	
	var content = '';
	for (var i=0; i<data.length; i++){
		content += '<tr>';
		for (var j=0; j<data[i].length; j++){
			content += '<td>'+data[i][j]+'</td>';
//			content += '<td>'+data[i][j].substr(0,20)+'</td>';
		}
		content += '</tr>';
	}
	
	table += '<thead>' + tableHeader + '</thead>' + '<tbody>' + content + '</tbody>' + '<tfoot>' + tableHeader + '</tfoot></table>';
	
	
	return table;
}

/*
 * This function (defined in init.js) is called when each of the data sources are clicked
 * the properties of these data sources are fetched and displayed so
 * that the user can input values for those, and restrict the query
 */
function showProperties(){

	$('#datasources :checkbox:checked').each(function() {
		
		if ($('#selectors').find('#'+$(this).val()).length == 0){
	
		    /** SourceDiv should look like this:
		    <div id="diseasome">
			<h3><a href="#">Diseasome</a></h3>
			<p>Search by property: <input type="textbox" id="property" value=""></p>
			</div> <!--com-->
			*/

			var option = $(this).val();
			var sourceDiv = '<div id="'+option+'">';
			sourceDiv += '<h3><a href="#">'+option+'</a></h3>';
			var sourcename = option+"_prop";
			var sourceid='#'+sourcename;
			sourceDiv += '<div id="'+sourcename+'"></div>';
			sourceDiv += '</div>';
			
			if ($('#selectors').find(option).length == 0){
				$('#selectors').append(sourceDiv).accordion('destroy').accordion({ header: "h3", autoHeight:false });
			}
			
			$(sourceid).append('Retrieving properties list from the <b>'+option+'</b> SPARQL endpoint. Please wait...<img src="images/ajax-loader.gif"/><br/><br/>');
			
			$.ajax({
			   url: "GetProperties",
			   processData: false,
			   data: "service="+dict[option],
			   success: function(msg){
					var propertyoptions = sourcename + "_options";
					var propertyoptionsid = "#" + propertyoptions;
					$(sourceid).html("");
					$(sourceid).append('Add values to the relevant properties:<br/><i>Use <b>FILTER</b> if you do not know the exact value for the property.<br/>Use <b>AND</b> or <b>OR</b> to specify whether this property value pair will be conjuncted or disjuncted with the query term you specified above.<br/><br/></i>');
					var tokens = msg.tokenize(",", " ", true); //converts the comma seperated string into an array
					$(sourceid).append("<table>");
					$.each(tokens, function(val, p) {
						$(sourceid).append("<tr><td><a href='"+p+"'>"+getNameFromURI(p)+"</td><td style='text-align:left' ><input id="+getNameFromURI(p)+" type='text' size='30' value=''/></td><td><form><input type='checkBox' value='FILTER'>FILTER</input>&nbsp;&nbsp;&nbsp;<input type='radio' value='AND'>AND</input><input type='radio' value='OR'>OR</input></form></td></tr>");
						
						//This Auto-completion code does not work! :(
//						var textboxid = "#"+getNameFromURI(p);
//						//Once the textbox gets the focus fetch all the property values from the SPARQL endpoint and display
//						$(textboxid).click(function(){
//							$.ajax({
//							   url: "GetPropertyVals",
//							   processData: false,
//							   data: "service="+dict[option]+"&property="+p,
//							   success: function(msg){
//									//@@TODO: Fix the CSS
//									var data = msg.tokenize(",", " ", true);  //converts the comma seperated string into an array
////									for (var i=0; i<data.length; i++){
////										data[i] = getNameFromURI(data[i]);
////									}
//									data = "aaa bbb ccc";
//									$(textboxid).autocomplete(data);
////									$(textboxid).val(data);
//
//							   }
//							});
//						});
					});
					
					$(sourceid).append("</table>");
					
					$('#selectors').accordion('destroy').accordion({ header: "h3", autoHeight:false });
		     	}
			 });
		}
		});

		$("#datasources :input:not(:checked)").each(function() {
			$('#selectors').find('#'+$(this).val()).remove();
		});

}

function displayOld(){
	$('#ajax-load').html('');
	var headers = ["diseases"];
	var data = [["Coronary artery disease"],
	            ["Coronary artery disease, autosomal dominant, 1, 608320"],
	            ["Coronary artery disease in familial hypercholesterolemia, protection against, 143890"],
	            ["Coronary artery disease, susceptibility to"]];
	var html = createDataTable(headers,data);
	$('#dt_container').html(html);
	$("#dt_container").dialog("open");
	//@@TODO: I dunno why the last column is always smaller than the others - try to find a fix
	$('.dataTable').dataTable();
}

function searchSelected(){
	var query = 'SELECT distinct ?disease WHERE { {?x <http://www.w3.org/2000/01/rdf-schema#label> ?disease FILTER regex(?disease, "coronary artery disease", "i"). ?x <http://www4.wiwiss.fu-berlin.de/diseasome/resource/diseasome/class> <http://www4.wiwiss.fu-berlin.de/diseasome/resource/diseaseClass/Cardiovascular>}  UNION { ?x <http://www4.wiwiss.fu-berlin.de/diseasome/resource/diseasome/associatedGene> <http://www4.wiwiss.fu-berlin.de/diseasome/resource/genes/ABCA1>.}}';
	addDialog('Constructed Query', query);
	$('#ajax-load').html('<img src="images/ajax-loader.gif"/>');
	setTimeout("display()",3000);
//	$.ajax({
//	   url: "GetSelected",
//	   processData: false,
//	   data: "query="+query,
//	   success: function(msg){
//			$('#ajax-load').html("");
//			alert(msg);
//	   }
//	});
}

function addDialog(title, info){
	$("#container").title = title;
	$("#container").append(document.createTextNode(info));
	$("#container").dialog({title: title,
	      width: 500,
	      position: ['center', 'top'],
	      buttons: { "Ok": function() {
		$(this).dialog("close"); 
		$(this).dialog("destroy");
		$(this).empty();
	      }
	    } 
	  });
}