var ejs = require("ejs");
var mysql = require('./mysql');
var mq_client = require('../rpc/client');
//var mysql = require('./mysql_my_connectionpooling'); // this includes my connection pooling
var loginStatus = false;
var crypto = require('crypto');
var assert = require('assert');
var algorithm = 'aes256'; 
var key = 'key_cmpe273_linkedin_application';
key = crypto.createHash('sha1').update(key).digest('hex');
var months = ['Jan','Feb','Mar','Apr','May','June','July','Aug','Sep','Oct','Nov','Dec'];


function cipherText(text)
{
	var cipher = crypto.createCipher(algorithm, key);  
	var encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
	return encrypted;
}

function decipherText(text)
{
	var decipher = crypto.createDecipher(algorithm, key);
	var decrypted = decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
	return decrypted;
}

exports.signUp = function(req,res)
{
	var TABLE_NAME = 'users';
	var firstname = req.param('firstname'),
	lastname = req.param('lastname'),
	email = req.param('email'),
	pass = req.param('password'),
	password = cipherText(pass);
	var currentdate = new Date(),
	datetime = currentdate.getDate() + " "
	+ (months[currentdate.getMonth()])  + " " 
	+ currentdate.getFullYear() + " at "  
	+ (currentdate.getHours() > 12 ? currentdate.getHours() - 12 : currentdate.getHours() ) + ":"  
	+ currentdate.getMinutes()+" "+(currentdate.getHours() > 12 ? "PM" : "AM" );
	var createdOn = datetime;
	var msg_payload = { "firstname": firstname, "lastname": lastname, "email": email, "password": password, "createdOn": createdOn,"method":"signUp" };

	if(firstname!='' && email != '' && password!= '')
	{
		mq_client.make_request('login_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 200){
					console.log("valid Login");

					res.end(JSON.stringify(results));
				}
				else {    

					console.log("Invalid Login");
					res.end(JSON.stringify(results));
				}
			}  
		});
	}
	else
	{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}

};

exports.checkLogin = function(req,res)
{
	var username = req.param("username");
	var pass = req.param("password");
	var password = cipherText(pass);
	var currentdate = new Date(),
	datetime = currentdate.getDate() + " "
	+ (months[currentdate.getMonth()])  + " " 
	+ currentdate.getFullYear() + " at "  
	+ (currentdate.getHours() > 12 ? currentdate.getHours() - 12 : currentdate.getHours() ) + ":"  
	+ currentdate.getMinutes()+" "+(currentdate.getHours() > 12 ? "PM" : "AM" );
	var thisSessionLogInTime = datetime;
	var results,resultExperienceAndEducation;
	var msg_payload = { "username": username, "password": password,"method":"checkLogin" };
	console.log("msg_payload "+msg_payload);

	if(username != '' && password!= '')
	{
		mq_client.make_request('login_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 200){

					req.session.userEmail = results.statusObject[0].user_email;
					req.session.userId = results.statusObject[0].user_id;
					req.session.userFirstname = results.statusObject[0].user_firstname;
					req.session.userLastname = results.statusObject[0].user_lastname;
					req.session.userLastLoggedIn = results.statusObject[0].user_last_logged_in;
					req.session.thisSessionLogInTime = thisSessionLogInTime;
					console.log("valid Login "+results.statusObject[0]);
					res.end(JSON.stringify(results));
				}
				else {    

					console.log("Invalid Login");
					res.end(JSON.stringify(results));
				}
			}  
		});
	}
	else
	{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.login = function(req,res)
{
	if(req.session.userId)
	{
		var firstname = req.session.userFirstname;
		console.log(firstname);
		var lastname = req.session.userLastname;
		console.log(lastname);
		var lastLoggedIn = req.session.userLastLoggedIn;
		console.log(lastLoggedIn);
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.render('home', { title: 'World\'s Largest Professional Network | LinkedIn ',firstname:firstname,lastname:lastname,lastLoggedIn:lastLoggedIn});
	}
	else
	{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.getProfile = function(req,res)
{
	if(req.session.userId)
	{
		var msg_payload = { "userId": req.session.userId,"method":"getProfile" };
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 201){
					console.log(results+" results in getProfile");
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid Login");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}
	else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.profile = function(req,res)
{
	if(req.session.userId)
	{
		var TABLE_NAME_1 = "users";
		var TABLE_NAME_2 = "profile";
		var profileStatus = req.param("profileStatus");
		var profilelocationAndJobProfile = req.param("profilelocationAndJobProfile");
		var firstName = req.param('profileFirstName');
		var lastName = req.param('profileLastName');


		var msg_payload = { "userId": req.session.userId,"profileStatus":profileStatus,
				"profilelocationAndJobProfile":profilelocationAndJobProfile,
				"firstName":firstName,"lastName":lastName,"method":"profile" };
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					console.log(results+" results in getProfile");
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid Profile Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else
	{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}

};

exports.getSummary = function(req,res)
{
	if(req.session.userId)
	{
		var msg_payload = { "userId": req.session.userId,"method":"getSummary" };
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 201){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid Summary Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}


};

exports.summary = function(req,res)
{
	if(req.session.userId)
	{
		var profileSummary = req.param("profileSummary");
		profileSummary = profileSummary.replace("'","");
		var msg_payload = { "userId": req.session.userId,"profileSummary":profileSummary,"method":"summary" };
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid summary Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}


};

exports.getEducationDetails = function(req,res)
{
	if(req.session.userId)
	{
		var msg_payload = { "userId": req.session.userId,"method":"getEducationDetails" };
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid getEducationDetails Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.getSkills = function(req,res)
{
	if(req.session.userId)
	{
		var msg_payload = { "userId": req.session.userId,"method":"getSkills" };
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid getSkills Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.skills = function(req,res)
{
	if(req.session.userId)
	{
		var skillsObject = req.param("skillsObject");
		skillsObject = JSON.parse(skillsObject);

		var skillsArray = [];

		for(var i=0; i<skillsObject.length;i++)
		{
			skillsArray.push(skillsObject[i].skill);
		}
		var msg_payload = { "userId": req.session.userId,"skillsArray":skillsArray,"method":"skills" };
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid skills Update");
					res.send(JSON.stringify(results));
				}
			}  
		});


	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}


};

exports.education = function(req,res)
{
	if(req.session.userId)
	{
		var educationObject = req.param("educationObject");
		educationObject = JSON.parse(educationObject);

		console.log(educationObject[0].education_id);

		var msg_payload = { "userId": req.session.userId,"educationObject":educationObject,"method":"education" };
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid education Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}
	else
	{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}

};

exports.getExperienceDetails = function(req,res)
{
	if(req.session.userId)
	{
		var msg_payload = { "userId": req.session.userId,"method":"getExperienceDetails"};
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid getExperienceDetails Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.experience = function(req,res)
{
	var experienceObject = req.param("experienceObject");
	experienceObject = JSON.parse(experienceObject);

	if(req.session.userId)
	{
		var msg_payload = { "userId": req.session.userId,"experienceObject":experienceObject,"method":"experience" };
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid Experience Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}
};

exports.getConnectionsCount = function(req,res)
{
	if(req.session.userId)
	{

		var msg_payload = { "userId": req.session.userId,"method":"getConnectionsCount"};
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('profile_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid skills Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}


};

exports.redirectToConnections = function(req,res)
{
	if(req.session.userId)
	{
		if(req.session.userEmail)
		{
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			res.render("connections",{title: 'World\'s Largest Professional Network | LinkedIn ',
				userEmail : req.session.userEmail,
				userFirstname : req.session.userFirstname,
				userLastname : req.session.userLastname,
				userId : req.session.userId,
				userLastLoggedIn : req.session.userLastLoggedIn
			});
		}
		else
		{
			res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
			res.render("connections",{title: 'World\'s Largest Professional Network | LinkedIn ',
				userEmail : "",
				userFirstname : "",
				userLastname : "",
				userId : "",
				userLastLoggedIn : ""
			});
		}
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.getConnections = function(req,res)
{
	if(req.session.userId)
	{
		var msg_payload = { "userId": req.session.userId,"method":"getConnections"};
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('connections_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid skills Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.getPendingConnections = function(req,res)
{
	if(req.session.userId)
	{
		var msg_payload = { "userId": req.session.userId,"method":"getPendingConnections"};
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('connections_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid skills Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.addConnections = function(req,res)
{
	if(req.session.userId)
	{
		var user_id = req.param("addConnectionToUserId");
		var user_ref_id = req.param("addConnectionToRefUserId");

		var msg_payload = { "userId": req.session.userId,"addConnectionToUserId":user_id,"addConnectionToRefUserId":user_ref_id,
				"userFirstname":req.session.userFirstname,"userLastname":req.session.userLastname,"method":"addConnections"};
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('connections_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid skills Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.getSearchedConnections = function(req,res)
{
	if(req.session.userId)
	{
		var searchedName = req.param("searchName");
		var msg_payload = { "userId": req.session.userId,"sname":searchedName,"method":"getSearchedConnections"};
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('connections_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid skills Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.rejectConnection = function(req,res)
{
	if(req.session.userId)
	{
		var user_ref_id = req.param("connectionToRefUserId");
		var msg_payload = { "userId": req.session.userId,"user_ref_id":user_ref_id,"method":"rejectConnection"};
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('connections_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid skills Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}


};

exports.sendInvitation = function(req,res)
{
	if(req.session.userId)
	{
		var hisHerInvitationId = req.param("user_id");

		var msg_payload = { "userId": req.session.userId,"hisHerInvitationId":hisHerInvitationId,
				"userFirstname":req.session.userFirstname,
				"userLastname":req.session.userLastname,
				"method":"sendInvitation"};
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('connections_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid skills Update");
					res.send(JSON.stringify(results));
				}
			}  
		});
	}else{
		res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.logout = function(req,res)
{
	if(req.session.userId)
	{
		var lastLoggedInTime = req.session.thisSessionLogInTime;
		var userId = req.session.userId;


		var msg_payload = { "userId": req.session.userId,"lastLoggedInTime":lastLoggedInTime,"method":"logout"};
		console.log(msg_payload+" msg_payload");
		mq_client.make_request('login_queue',msg_payload, function(err,results){

			console.log(results);
			if(err){
				throw err;
			}
			else 
			{
				if(results.statusCode == 204){
					req.session.destroy();

					res.send(JSON.stringify(results));
				}
				else {    

					console.log("Invalid skills Update");
					res.send(JSON.stringify(results));
				}
			}  
		});



		var updateLoggedInTime = "update users set user_last_logged_in = '"+lastLoggedInTime+"' where user_id = "+userId+";";

		console.log("updateLoggedInTime Query is "+updateLoggedInTime);
		mysql.insertData(function(err,results){
			if(err)
			{
				throw err;
			}
			else 
			{
				if(results.affectedRows > 0)
				{
					var response = {
							statusCode  : 204,
							statusMessage : 'Updated Successfully'
					};
					res.send(JSON.stringify(response));
				}
				else
				{    
					var responseFailure = {
							statusCode  : 201,
							statusMessage : 'Account Not Created'
					};

					res.send(JSON.stringify(responseFailure));
				}
			}  
		},updateLoggedInTime);
	}
};