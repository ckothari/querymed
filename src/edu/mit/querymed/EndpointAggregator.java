package edu.mit.querymed;

import java.util.List;
import com.hp.hpl.jena.query.*;

public class EndpointAggregator {
	private String [] endpoints;
	private String input;
	private String diseasomeQuery;
	private String dailymedQuery;
	private static final String DISEASOME_ENDPOINT = "http://www4.wiwiss.fu-berlin.de/diseasome/sparql";
	private static final String DAILYMED_ENDPOINT = "http://www4.wiwiss.fu-berlin.de/dailymed/sparql";
	private static final int DISEASOME_INDEX = 0;
	private static final int DAILYMED_INDEX = 1;

	
	//Constructor
	public EndpointAggregator(String[] endpoints, String input) {
			this.endpoints = endpoints;
			this.input = input;
		}
	
	public EndpointAggregator(String input){
		String[] endpoints = new String[2];
		endpoints[DISEASOME_INDEX] = DISEASOME_ENDPOINT;
		endpoints[DAILYMED_INDEX] = DAILYMED_ENDPOINT;
		this.endpoints = endpoints;
		this.input = input;
		this.diseasomeQuery = 	"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> SELECT ?disease WHERE {?x rdfs:label ?disease FILTER regex(?disease, '" + input  + "', 'i') }";
		this.dailymedQuery = "PREFIX dailymed: <http://www4.wiwiss.fu-berlin.de/dailymed/resource/dailymed/> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> SELECT ?name ?indication WHERE {?x dailymed:indication ?indication FILTER regex(?indication, '" + input +"', 'i') ?x rdfs:label ?name}";
	}
	
	public QueryExecution[] constructSelectQueries() {
		QueryExecution[] qes = new QueryExecution[2];
		QueryExecution e1  = QueryExecutionFactory.sparqlService(endpoints[DISEASOME_INDEX], diseasomeQuery);
		QueryExecution e2  = QueryExecutionFactory.sparqlService(endpoints[DAILYMED_INDEX], dailymedQuery);
		qes[0] = e1;
		qes[1] = e2;
		return qes;
	}
	
	public void printResults(QueryExecution[] qes) {
		for (int i = 0; i < qes.length; i++) { 
			ResultSet results = qes[i].execSelect();	
			while (results.hasNext()){
    				QuerySolution s = results.next();
    				System.out.println(s);
			}
		}
	}
		
	 public static void main(String[] args) {
		 			EndpointAggregator ea = new EndpointAggregator("coronary artery disease");
		 			QueryExecution[] qes = ea.constructSelectQueries();
		 			ea.printResults(qes);
	 }
	
}



