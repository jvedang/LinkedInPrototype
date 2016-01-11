var amqp = require('amqp');
var crypto = require('crypto');

var TIMEOUT = 5000;// 10 seconds for the reply
var CONTENT_TYPE='application/json';
var CONTENT_ENCODING='utf-8';
var connection;

function set_up_response_queue(entry,publish_function) {
	connection.queue('',{exclusive:true},function(queue){
		var queue_name = queue.name;
		queue.subscribe(function(message, headers, deliveryInfo, m){
			console.log(message+" ::: message");
			entry.callback(null,message);
		});
		console.log(queue_name+" ::: queue_name");
		return publish_function(queue_name);
	});
}

exports.addRequestToQueue = function(queue_name,content,callback)
{
	connection = amqp.createConnection({host:'127.0.0.1'});
	var correlation_id = crypto.randomBytes(16).toString('hex');

	console.log(correlation_id+" ::: correlation_id");
	var t_id = setTimeout(function(corr_id)
			{
		callback(new Error("timeout " + corr_id));
			}, TIMEOUT, correlation_id);

	var entry = {
			callback : callback,
			timeout_id : t_id
	};

	console.log(entry+" ::: entry");


	set_up_response_queue(entry,function(response_queue){
		console.log(queue_name+" ::: queue_name");
		connection.publish(queue_name,content,{
			correlationId:correlation_id,
			contentType:CONTENT_TYPE,
			contentEncoding:CONTENT_ENCODING,
			replyTo:response_queue});
	});

};
