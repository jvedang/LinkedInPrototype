var ejs = require("ejs");
var mysql = require('./mysql');
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

exports.signUp = function(message,callback)
{
	var TABLE_NAME = 'users';
	var firstname = message.firstname;
	var lastname = message.lastname;
	var email = message.email;
	var password = message.password;
	var currentdate = message.currentdate;
	var responseMessage;
	
	if(firstname!='' && email != '' && password!= '')
	{
		var signUpQuery = "insert into "+TABLE_NAME+"(user_firstname,user_lastname,user_email,user_password,user_last_logged_in,user_date_created) " +
		"values" +
		"('"+firstname+"','"+lastname+"','"+email+"','"+password+"','','"+currentdate+"');"; 

		console.log("Query is : "+signUpQuery);

		mysql.insertData(function(err,results){
			if(err)
			{
				throw err;
			}
			else 
			{
				if(results.affectedRows > 0)
				{

					var signUpQuery = "insert into profile(profile_user_fk,profile_skills) values((select user_id from users where user_email='"+email+"'),'');";

					mysql.insertData(function(err,results){
						if(err)
						{
							throw err;
						}
						else 
						{
							if(results.affectedRows > 0)
							{
								var responseSuccess = {
										statusCode  : 200,
										statusMessage : 'Account Created Successfully'
								};

								console.log("------------------------");
								console.log("Account Created - LinkedIn");
								console.log("------------------------");

								callback(null, responseSuccess);
							}
							else
							{    
								var responseFailure = {
										statusCode  : 201,
										statusMessage : 'Account Not Created'
								};

								callback(null, responseFailure);
							}
						}  
					},signUpQuery);
				}
				else
				{    
					var responseFailure = {
							statusCode  : 201,
							statusMessage : 'Account Not Created'
					};

					callback(null, responseFailure);
				}
			}  
		},signUpQuery);
	}
	else
	{
		var responseFailure = {
				statusCode  : 201,
				statusMessage : 'Account Not Created'
		};

		callback(null, responseFailure);
 	}
};

exports.checkLogin = function(message,callback)
{
	
	var TABLE_NAME = 'users';
	var username = message.username;
	var password = message.password;

	if(username != '' && password!= '')
	{
		var checkLoginQuery = "select user_id,user_firstname,user_lastname,user_email,user_last_logged_in from users where user_email = '"+username+"' and user_password = '"+password+"';";

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
				if (results.length > 0) 
				{
					console.log("Valid Login");

					var response = {
							statusCode  : 200,
							statusObject : results,
							statusMessage : "Valid Login"
					};

					callback(null, response);
				}
				else
				{
					console.log("InValid Login");

					var responseError = {
							statusCode  : 202,
							statusObject : results,
							statusMessage : "InValid Login"
					};

					callback(null, responseError);
				}
			}
				}, checkLoginQuery);
	}
	else
	{
		console.log("InValid Login");

		var responseError = {
				statusCode  : 202,
				statusObject : "",
				statusMessage : "InValid Login"
		};

		callback(null, responseError);
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

exports.getProfile = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	if(userId)
	{
		var getProfileQuery = "select profile_id,profile_user_fk,profile_status,profile_location from profile where profile_user_fk="+userId+";";

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
				if (results.length > 0) 
				{

					var response = {
							statusCode  : 201,
							profile_status : results[0].profile_status,
							profile_location : results[0].profile_location
					};

					callback(null, response);
				}
				else
				{
					var responseError = {
							statusCode  : 202,
							result : "{InValid Login}"
					};

					callback(null, responseError);
				}
			}
				}, getProfileQuery);
	}
	else{
		var responseError = {
				statusCode  : 202,
				result : "{InValid Login}"
		};

		callback(null, responseError);
	}
};

exports.profile = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	if(userId)
	{
		var TABLE_NAME_1 = "users";
		var TABLE_NAME_2 = "profile";
		var profileStatus = message.profileStatus;
		var profilelocationAndJobProfile = message.profilelocationAndJobProfile;
		var firstName = message.firstName;
		var lastName = message.lastName;

		var updateProfie = "update linkedin.profile set profile.profile_status='"+profileStatus+"' ," +
		"profile.profile_location='"+profilelocationAndJobProfile+"' where profile.profile_user_fk="+userId+";";

		mysql.insertData(function(err,results){
			if(err)
			{
				throw err;
			}
			else 
			{
				if(results.affectedRows > 0)
				{

					var updateUser = "update linkedin.users set users.user_firstname='"+firstName+"', " +
					"users.user_lastname='"+lastName+"' where users.user_id ="+userId+";";

					mysql.insertData(function(err,results){
						if(err)
						{
							throw err;
						}
						else 
						{
							if(results.affectedRows > 0)
							{

								var sqlReturnQuery = "select (select users.user_firstname from users where users.user_id="+userId+")as firstname ," +
								"(select users.user_lastname from users where users.user_id="+userId+")as lastname," +
								"profile.profile_status,profile_location from profile where profile.profile_user_fk="+userId+";";


								mysql.fetchData(function(err, results)
										{
									if (err) 
									{
										throw err;
									} 
									else
									{
										if (results.length > 0) 
										{
											for ( var i = 0; i < results.length; i++) 
											{
												console.log(results[i].user_email);
											}

											var response = {
													statusCode  : 204,
													results : results
											};
											
											callback(null, response);
											
										}
										else
										{
											callback(null, {error:"error"});
											
										}
									}
										}, sqlReturnQuery);
							}
							else
							{    
								var responseFailure = {
										statusCode  : 201,
										statusMessage : 'Account Not Created'
								};

								callback(null, responseFailure);
								
							}
						}  
					},updateUser);
				}
				else
				{    
					var responseFailure = {
							statusCode  : 201,
							statusMessage : 'Account Not Created'
					};

					callback(null, responseFailure);
					
				}
			}  
		},updateProfie);

	}else
	{
		var responseFailure = {
				statusCode  : 201,
				statusMessage : 'Account Not Created'
		};

		callback(null, responseFailure);

	}

};

exports.getSummary = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	if(userId)
	{
		var getSummaryQuery = "select profile_summary from profile where profile_user_fk="+userId+";";

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
				if (results.length > 0) 
				{

					var response = {
							statusCode  : 201,
							profile_summary : results[0].profile_summary
					};

					callback(null, response);
					
				}
				else
				{
					var responseError = {
							statusCode  : 202,
							result : "{InValid Login}"
					};

					callback(null, responseError);
					
				}
			}
				}, getSummaryQuery);
	}else{
		var responseError = {
				statusCode  : 202,
				result : "{InValid Login}"
		};

		callback(null, responseError);
		
	}


};

exports.summary = function(message,callback)
{
	var userId = message.userId;
	var profileSummary = message.profileSummary;
	console.log(userId+" is userId");
	if(userId)
	{
		var updateSummary = "update linkedin.profile set profile.profile_summary=\""+profileSummary+"\" " +
		" where profile.profile_user_fk="+userId+";";

		console.log("updateSummary Query is "+updateSummary);
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
					
					callback(null, response);
				
				}
				else
				{    
					var responseFailure = {
							statusCode  : 201,
							statusMessage : 'Account Not Created'
					};

					callback(null, responseFailure);
				
				}
			}  
		},updateSummary);
	}else{
		var responseFailure = {
				statusCode  : 201,
				statusMessage : 'Account Not Created'
		};

		callback(null, responseFailure);
		
	}


};

exports.getEducationDetails = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var getEducationDetails = "select education_id,education_degree,education_year,education_university from linkedin.education where education_user_fk="+userId+";";

		console.log("getEducationDetails Query is "+getEducationDetails);

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
				
				if (results.length > 0) 
				{
					for ( var i = 0; i < results.length; i++) 
					{
						console.log(results[i].education_degree);
					}

					response = 
					{
							statusCode : 204,
							resultSet : results
					};

					callback(null, response);
					//res.send(JSON.stringify(response));
				}
				else
				{
					response = 
					{
							statusCode : 324,
							resultSet : ""
					};

					callback(null, response);
					//res.send(JSON.stringify(response));
				}
			}
				}, getEducationDetails);

	}else{
		response = 
		{
				statusCode : 324,
				resultSet : ""
		};

		callback(null, response);
		//res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.getSkills = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var getSkills = "select profile_skills from linkedin.profile where profile_user_fk="+userId+";";

		console.log("getSkills Query is "+getSkills);

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
				console.log(results.length + " profile Skills");
				if (results.length > 0) 
				{
					for ( var i = 0; i < results.length; i++) 
					{
						console.log(results[i].profile_skills + " profile Skills");
					}

					if(results[0].profile_skills != null)
					{
						if(results[0].profile_skills.length > 0)
						{
							response = 
							{
									statusCode : 204,
									resultSet : results[0].profile_skills
							};
						}
						else
						{
							response = 
							{
									statusCode : 324,
									resultSet : ""
							};
						}
					}
					else
					{
						response = 
						{
								statusCode : 324,
								resultSet : ""
						};
					}

					callback(null, response);
					//res.send(JSON.stringify(response));
				}
				else
				{
					response = 
					{
							statusCode : 324,
							resultSet : ""
					};

					callback(null, response);
					//res.send(JSON.stringify(response));
				}
			}
				}, getSkills);

	}else{
		response = 
		{
				statusCode : 324,
				resultSet : ""
		};

		callback(null, response);
		//res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.skills = function(message,callback)
{
	var userId = message.userId;
	var skillsArray = message.skillsArray;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		console.log("skillsArray "+ skillsArray);
		var updateSkills = "update linkedin.profile set profile.profile_skills ='"+skillsArray+"' " +
		" where profile.profile_user_fk="+userId+";";

		console.log("updateSkills Query is "+updateSkills);
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
					
					callback(null, response);
					//res.send(JSON.stringify(response));
				}
				else
				{    
					var responseFailure = {
							statusCode  : 201,
							statusMessage : 'Account Not Created'
					};

					callback(null, responseFailure);
					//res.send(JSON.stringify(responseFailure));
				}
			}  
		},updateSkills);
	}else{
		var responseFailure = {
				statusCode  : 201,
				statusMessage : 'Account Not Created'
		};

		callback(null, responseFailure);
		//res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}


};

exports.education = function(message,callback)
{
	var userId = message.userId;
	var educationObject = message.educationObject;
	educationObject = JSON.parse(educationObject);

	console.log(educationObject[0].education_id+" in education");
	if(educationObject[0].education_id == 0)
	{
		var insertQuery = "insert into education(education_user_fk,education_degree,education_year,education_university)"+
		" values"+
		"("+userId+",'"+educationObject[0].education_degree+"','"+educationObject[0].education_year+"','"+educationObject[0].education_university+"'),"+
		"("+userId+",'"+educationObject[1].education_degree+"','"+educationObject[1].education_year+"','"+educationObject[1].education_university+"');";

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
					callback(null, response);
					//res.send(JSON.stringify(response));
				}
				else
				{    
					var responseFailure = {
							statusCode  : 201,
							statusMessage : 'Account Not Created'
					};

					callback(null, responseFailure);
					//res.send(JSON.stringify(responseFailure));
				}
			}  
		},insertQuery);
	}
	else
	{
		var updateQuery = "update education set education_degree="+
		"case "+
		"when education_id="+educationObject[0].education_id+" then '"+educationObject[0].education_degree+"' "+
		"when education_id="+educationObject[1].education_id+" then '"+educationObject[1].education_degree+"' "+
		"end, "+
		"education_year= "+
		"case "+
		"when education_id="+educationObject[0].education_id+" then '"+educationObject[0].education_year+"' "+
		"when education_id="+educationObject[1].education_id+" then '"+educationObject[1].education_year+"' "+
		"end, "+
		"education_university= "+
		"case "+
		"when education_id="+educationObject[0].education_id+" then '"+educationObject[0].education_university+"' "+
		"when education_id="+educationObject[1].education_id+" then '"+educationObject[1].education_university+"' "+
		"end "+
		"where education_id in ("+educationObject[0].education_id+","+educationObject[1].education_id+");";

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
					
					callback(null, response);
					//res.send(JSON.stringify(response));
				}
				else
				{    
					var responseFailure = {
							statusCode  : 201,
							statusMessage : 'Account Not Created'
					};

					callback(null, responseFailure);
					//res.send(JSON.stringify(responseFailure));
				}
			}  
		},updateQuery);
	}
};

exports.getExperienceDetails = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var getExperienceDetailsQuery = "select experience_id,experience_company_name,experience_details,experience_year,experience_designation from linkedin.experience where experience_user_fk="+userId+";";

		console.log("getExperienceDetailsQuery Query is "+getExperienceDetailsQuery);

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
				var response = "";
				if (results.length > 0) 
				{
					for ( var i = 0; i < results.length; i++) 
					{
						console.log("Experience :: "+results[i].education_degree);
					}

					response = 
					{
							statusCode : 204,
							resultSet : results
					};

					callback(null, response);
					//res.send(JSON.stringify(response));
				}
				else
				{
					response = 
					{
							statusCode : 324,
							resultSet :  results
					};

					callback(null, response);
					//res.send(JSON.stringify(response));
				}
			}
				}, getExperienceDetailsQuery);
	}else{
		
		response = 
		{
				statusCode : 324,
				resultSet :  ""
		};

		callback(null, response);
		//res.render('Login', { title: 'World\'s Largest Professional Network | LinkedIn '});
	}
};

exports.experience = function(req,res)
{

	var experienceObject = req.param("experienceObject");
	experienceObject = JSON.parse(experienceObject);

	console.log(experienceObject[0].experience_id);
	if(experienceObject[0].experience_id == 0)
	{
		var insertQuery = "insert into experience(experience_user_fk,experience_company_name,experience_year,experience_details,experience_designation)"+
		" values"+
		"("+req.session.userId+",'"+experienceObject[0].experience_company_name+"','"+experienceObject[0].experience_year+"','"+experienceObject[0].experience_details+"','"+experienceObject[0].experience_designation+"'),"+
		"("+req.session.userId+",'"+experienceObject[1].experience_company_name+"','"+experienceObject[1].experience_year+"','"+experienceObject[1].experience_details+"','"+experienceObject[0].experience_designation+"');";

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
		},insertQuery);
	}
	else
	{
		var updateQuery = "update experience set experience_company_name="+
		"case "+
		"when experience_id="+experienceObject[0].experience_id+" then '"+experienceObject[0].experience_company_name+"' "+
		"when experience_id="+experienceObject[1].experience_id+" then '"+experienceObject[1].experience_company_name+"' "+
		"end, "+
		"experience_year= "+
		"case "+
		"when experience_id="+experienceObject[0].experience_id+" then '"+experienceObject[0].experience_year+"' "+
		"when experience_id="+experienceObject[1].experience_id+" then '"+experienceObject[1].experience_year+"' "+
		"end, "+
		"experience_details= "+
		"case "+
		"when experience_id="+experienceObject[0].experience_id+" then '"+experienceObject[0].experience_details+"' "+
		"when experience_id="+experienceObject[1].experience_id+" then '"+experienceObject[1].experience_details+"' "+
		"end, "+
		"experience_designation= "+
		"case "+
		"when experience_id="+experienceObject[0].experience_id+" then '"+experienceObject[0].experience_designation+"' "+
		"when experience_id="+experienceObject[1].experience_id+" then '"+experienceObject[1].experience_designation+"' "+
		"end "+
		"where experience_id in ("+experienceObject[0].experience_id+","+experienceObject[1].experience_id+");";

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
		},updateQuery);
	}

};

exports.getConnectionsCount = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var getConnectionsCountQuery = "select distinct (select count(connections_id) from connections" +
		" where connections_user_fk = "+userId+" and connections_status = 2) as countConnections," +
		" (select count(connections_id) from connections where connections_user_fk = "+userId+" and connections_status = 0)" +
		" as connectionsPending from connections;";

		console.log("getConnectionsCountQuery Query is "+getConnectionsCountQuery);

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
				var response = "";
				if (results.length > 0) 
				{
					for ( var i = 0; i < results.length; i++) 
					{
						console.log(results[i].education_degree);
					}

					response = 
					{
							statusCode : 204,
							countConnections : results[0].countConnections,
							connectionsPending : results[0].connectionsPending
					};

					callback(null, response);
					
				}
				else
				{
					response = 
					{
							statusCode : 324,
							countConnections : "0",
							connectionsPending : "0"
					};

					callback(null, response);
					
				}
			}
				}, getConnectionsCountQuery);

	}else{
		response = 
		{
				statusCode : 324,
				countConnections : "0",
				connectionsPending : "0"
		};

		callback(null, response);
		
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

exports.getConnections = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var getConnectionsQuery = "select connections_id,connections_firstname,connections_lastname,profile_location,"+
		" profile_status,connections_ref_id from connections,profile where connections_ref_id = profile_user_fk"+
		" and connections_user_fk = "+userId+" and connections_status = 2;";

		console.log("getConnectionsQuery Query is "+getConnectionsQuery);

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
		
				if (results.length > 0) 
				{
					for ( var i = 0; i < results.length; i++) 
					{
						console.log(results[i].connections_firstname);
					}

					response = 
					{
							statusCode : 204,
							resultSet : results
					};

					callback(null, response);
				
				}
				else
				{
					response = 
					{
							statusCode : 324,
							resultSet : "[{connections_id:0,connections_firstname:/"/",connections_lastname:/"/",connections_ref_id:0}]"
					};

					callback(null, response);
					
				}
			}
				}, getConnectionsQuery);

	}else{}
};

exports.getPendingConnections = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var getPendingConnectionsQuery = "select connections_id,connections_firstname,connections_lastname," +
		"connections_ref_id from connections where connections_user_fk = "+userId+" " +
		"and connections_status = 0;";

		console.log("getPendingConnectionsQuery Query is "+getPendingConnectionsQuery);

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
				var response = "";
				if (results.length > 0) 
				{
					for ( var i = 0; i < results.length; i++) 
					{
						console.log(results[i].connections_firstname);
					}

					response = 
					{
							statusCode : 204,
							resultSet : results
					};

					callback(null, response);
				}
				else
				{
					response = 
					{
							statusCode : 324,
							resultSet : "[{connections_id:0,connections_firstname:/"/",connections_lastname:/"/",connections_ref_id:0}]"
					};

					callback(null, response);
				}
			}
				}, getPendingConnectionsQuery);

	}else{}
};

exports.addConnections = function(message,callback)
{
	var user_id = message.addConnectionToUserId;
	var user_ref_id = message.addConnectionToRefUserId;
	var firstName = message.userFirstname;
	var lastName = message.userLastname;
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var addConnection = "update connections set connections_status = 2 where connections_ref_id="+user_ref_id+" and connections_user_fk="+userId+";";

		console.log("addConnection Query is "+addConnection);

		mysql.insertData(function(err,results){
			if(err)
			{
				throw err;
			}
			else 
			{
				if(results.affectedRows > 0)
				{

					//-----------------------------------------------------

					var sendInvitation = "insert into connections(connections_status,connections_firstname,connections_lastname,connections_ref_id,connections_user_fk) " +
					"values" +
					"(2,'"+firstName+"','"+lastName+"',"+userId+","+user_ref_id+");";

					console.log("sendInvitation Query is "+sendInvitation);

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
								
								callback(null, response);
							}
							else
							{    
								var responseFailure = {
										statusCode  : 202,
										statusMessage : 'Account Not Created'
								};

								callback(null, responseFailure);
							}
						}  
					},sendInvitation);
				}
				else
				{    
					var responseFailure = {
							statusCode  : 201,
							statusMessage : 'Account Not Created'
					};

					callback(null, responseFailure);
				}
			}  
		},addConnection);
	}else{}
};

exports.getSearchedConnections = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var searchedName = message.sname;
		console.log("searchedName is "+searchedName);
		var searchedQuery = "select user_id,user_firstname,user_lastname,user_email from users where user_firstname LIKE '%"+searchedName+"%' OR user_firstname LIKE '%"+searchedName+"' OR user_firstname LIKE '"+searchedName+"%' "+
		"OR user_lastname LIKE '%"+searchedName+"%' OR user_lastname LIKE '%"+searchedName+"' OR user_lastname LIKE '"+searchedName+"%'";

		console.log("searchedQuery Query is "+searchedQuery);

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
				var response = "";
				if (results.length > 0) 
				{
					for ( var i = 0; i < results.length; i++) 
					{
						console.log(results[i].user_firstname);
					}

					response = 
					{
							statusCode : 201,
							resultSet : results
					};

					callback(null, response);
					//res.send(JSON.stringify(response));
				}
				else
				{
					response = 
					{
							statusCode : 324,
							resultSet : ""
					};

					callback(null, response);
				}
			}
				}, searchedQuery);
	}else{}
};

exports.rejectConnection = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var user_ref_id = message.user_ref_id;
		console.log("user_ref_id is "+user_ref_id);
		var deleteQuery = "delete from connections where connections_ref_id="+user_ref_id+" and connections_user_fk="+userId+";";

		console.log("deleteQuery Query is "+deleteQuery);

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
					
					callback(null, response);
				}
				else
				{    
					var responseFailure = {
							statusCode  : 201,
							statusMessage : 'Account Not Created'
					};
					
					callback(null, responseFailure);
				}
			}  
		},deleteQuery);
	}else{}
};

exports.sendInvitation = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var hisHerInvitationId = message.user_id;
		var userFirstname = message.userFirstname;
		var userLastname = message.userLastname;
		var checkInvitationExits = "select connections_id from connections where connections_ref_id = "+userId+" and connections_user_fk="+hisHerInvitationId+"";

		console.log("checkInvitationExits Query is "+checkInvitationExits);

		mysql.fetchData(function(err, results)
				{
			if (err) 
			{
				throw err;
			} 
			else
			{
				var response = "";
				if (results.length > 0) 
				{
					for ( var i = 0; i < results.length; i++) 
					{
						console.log(results[i].user_firstname);
					}

					response = 
					{
							statusCode : 204,
							resultSet : "User Already your added in your list"
					};

					callback(null, response);
					//res.send(JSON.stringify(response));
				}
				else
				{
					var sendInvitation = "insert into connections(connections_status,connections_firstname,connections_lastname,connections_ref_id,connections_user_fk) " +
					"values" +
					"(0,'"+userFirstname+"','"+userLastname+"',"+userId+","+hisHerInvitationId+");";

					console.log("sendInvitation Query is "+sendInvitation);

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
										statusCode  : 201,
										statusMessage : 'Updated Successfully'
								};
								
								callback(null, response);
							}
							else
							{    
								var responseFailure = {
										statusCode  : 202,
										statusMessage : 'Account Not Created'
								};

								callback(null, responseFailure);
							}
						}  
					},sendInvitation);
				}
			}
				}, checkInvitationExits);
	}else{}
};

exports.logout = function(message,callback)
{
	var userId = message.userId;
	console.log(userId+" is userId");
	var response = "";
	if(userId)
	{
		var lastLoggedInTime = message.lastLoggedInTime;

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
										
					callback(null, response);
				}
				else
				{    
					var responseFailure = {
							statusCode  : 201,
							statusMessage : 'Account Not Created'
					};

					callback(null, responseFailure);
				}
			}  
		},updateLoggedInTime);
	}
};