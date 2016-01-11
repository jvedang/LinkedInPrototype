var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , home = require('./routes/home')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: 'xyz12345'}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

//get requests
app.get('/', routes.index);
app.get('/users', user.list);
app.get('/home', home.login);
app.get('/connections', home.redirectToConnections);
app.get('/getProfile', home.getProfile);
app.get('/getConnectionsCount', home.getConnectionsCount);
app.get('/getSummary', home.getSummary);
app.get('/getSkills', home.getSkills);
app.get('/getEducationDetails', home.getEducationDetails);
app.get('/getExperienceDetails', home.getExperienceDetails);
app.get('/connectionsGet', home.getConnections);
app.get('/getPendingConnections', home.getPendingConnections);

//post requests
app.post('/signup', home.signUp);
app.post('/checkLogin', home.checkLogin);
app.post('/logout', home.logout);
app.post('/profile', home.profile);
app.post('/summary', home.summary);
app.post('/skills', home.skills);
app.post('/education', home.education);
app.post('/experience', home.experience);
app.post('/getEducationDetails', home.getEducationDetails);
app.post('/addConnections', home.addConnections);
app.post('/rejectConnection', home.rejectConnection);
app.post('/getSearchedConnections', home.getSearchedConnections);
app.post('/sendInvitation', home.sendInvitation);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
