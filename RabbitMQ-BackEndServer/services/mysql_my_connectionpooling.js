var ejs= require('ejs');
var mysql = require('mysql');
var pool = [],poolStatus = [];
var CONNECTION_OPEN = 0, CONNECTION_BUSY = 1;
var minimumPoolSize = 10, maximumPoolSize = 15;

function createConnection()
{
	var connection = mysql.createConnection({
		host     : 'localhost',
		user     : 'root',
		password : '',
		database : 'linkedin'
	});
	return connection;
}

function Pool()
{
	for(var i=0; i < minimumPoolSize; ++i)
	{
		pool.push(createConnection());
		poolStatus.push(CONNECTION_OPEN);
	}
}

function addConnectionToPool()
{
	pool.push(createConnection());
	poolStatus.push(CONNECTION_OPEN);
}

Pool.prototype.getConnection = function()
{
	var poolExausted = true;
	var poolJSON;
	for(var jCount = 0 ; jCount < pool.length ; jCount++)
	{
		if(poolStatus[jCount] === CONNECTION_OPEN)
		{
			poolStatus[jCount] = CONNECTION_BUSY;
			poolExausted = false;
			poolJSON = [{poolObject: pool[jCount],poolObjectLocation: jCount}];
			return poolJSON;
		}
	}

	if(poolExausted && pool.length < maximumPoolSize)
	{
		addConnectionToPool();
		poolStatus[pool.length-1] = CONNECTION_BUSY;
		poolExausted = false;
		poolJSON = [{poolObject: pool[pool.length-1],poolObjectLocation: jCount}];
		return poolJSON;
	}
};

Pool.prototype.releaseConnection = function(connectionObjectLocation)
{
	if(poolStatus[connectionObjectLocation] === CONNECTION_BUSY)
	{
		poolStatus[connectionObjectLocation] = CONNECTION_OPEN;
	}
};

var p = new Pool();

function fetchData(callback,sqlQuery){

	console.log("\nSQL Query::"+sqlQuery);

	var connectionFromPool = p.getConnection();
	var connection = connectionFromPool[0].poolObject;
	var connectionLocation = connectionFromPool[0].poolObjectLocation;

	connection.query(sqlQuery, function(err, rows, fields) {
		if(err){
			console.log("ERROR: " + err.message);
		}
		else 
		{	// return err or result
			console.log("DB Results:"+rows);
			callback(err, rows);
		}
	});
	console.log("\nConnection closed..");
	p.releaseConnection(connectionLocation);
}	

function insertData(callback,sqlQuery){

	console.log("\nSQL Query::"+sqlQuery);

	var connectionFromPool = p.getConnection();
	var connection = connectionFromPool[0].poolObject;
	var connectionLocation = connectionFromPool[0].poolObjectLocation;

	connection.query(sqlQuery, function(err, results)
			{
		console.log(results);
		if(err){
			console.log("ERROR: " + err.message);
		}
		else 
		{	
			callback(err, results);
		}
			});
	console.log("\nConnection closed..");
	p.releaseConnection(connectionLocation);
}

exports.fetchData = fetchData;
exports.insertData = insertData;