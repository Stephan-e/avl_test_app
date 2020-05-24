var express=require('express');
var cookieParser = require('cookie-parser')
var app= express();
var path=require('path')
var bodyParser = require('body-parser')// importing body parser middleware to parse form content from HTML
var nodemailer = require('nodemailer');//importing node mailer
var firebase = require('firebase-admin');
// app.engine('html', require('ejs').renderFile);


function serveContentForUser(endpoint, req, res, decodedClaims) {
    // Lookup the user information corresponding to cookie and return the profile data for the user.
    
    
    return firebase.auth().getUser(decodedClaims.sub).then(function(userRecord) {
        let uid = decodedClaims.uid;
        console.log(uid)

        let user = db.collection('users').doc(uid);
        user.get().then((docData) => {
            username = docData.data().username
            console.log(username)

        })
      var html = '<!DOCTYPE html>' +
        '<html>' +
        '<meta charset="UTF-8">' +
        '<link href="style.css" rel="stylesheet" type="text/css" media="screen" />' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<title>Sample Profile Page</title>' +
        '<body>' +
        '<div id="container">' +
        '  <h3>Welcome to Question App, '+( username || 'N/A') +'</h3>' +
        '  <div id="loaded">' +
        '    <div id="main">' +
        '      <div id="user-signed-in">' +
        '        <div id="user-info">' +
        '          <div id="photo-container">' +
        (userRecord.photoURL ? '      <img id="photo" src=' +userRecord.photoURL+ '>' : '') +
        '          </div>' +
        '          <div id="name"> Display Name: ' + userRecord.displayName + '</div>' +
        '          <div id="name"> Username: ' + username + '</div>' +
        '          <div id="email">'+
        userRecord.email + ' (' + (userRecord.emailVerified ? 'verified' : 'unverified') + ')</div>' +
        '          <div class="clearfix"></div>' +
        '        </div>' +
        '        <p>' +
        '          <button id="sign-out" onClick="window.location.assign(\'/logout\')">Sign Out</button>' +
        '          <button id="delete-account" onClick="window.location.assign(\'/delete\')">' +
        'Delete account</button>' +
        '        </p>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '</body>' +
        '</html>';
      res.set('Content-Type', 'text/html');
      res.end(html);
    });
  }
  

function attachCsrfToken(url, cookie, value) {
return function(req, res, next) {
    if (req.url == url) {
    res.cookie(cookie, value);
    }
    next();
}
}
  

function checkIfSignedIn(url) {

return function(req, res, next) {
    if (req.url == url) {
    var sessionCookie = req.cookies.session || '';
    // User already logged in. Redirect to profile page.
    firebase.auth().verifySessionCookie(sessionCookie).then(function(decodedClaims) {
        res.redirect('/problem');
    }).catch(function(error) {
        next();
    });
    } else {
    next();
    }
}
}

app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');

app.use(cookieParser());
app.use(attachCsrfToken('/', 'csrfToken', (Math.random()* 100000000000000000).toString()));
app.use(checkIfSignedIn('/'));

app.use('/', express.static('views'));

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

var serviceAccount = require('./serviceAccountKey.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://avl-backend.firebaseio.com'
});

const db = firebase.firestore();
let problem = db.collection('problem');
const settings = {timestampsInSnapshots: true};
db.settings(settings);

let results = []
let session_res = results
let question=[]
let user = []
let firstThree = problem.orderBy('answer').limit(50)
    firstThree.get()
    .then(snapshot => {

        snapshot.forEach(doc => {
        result = doc.data()
        results.push(result)
        
        })
    })


app.get('/',(req,res,next)=>{
    res.render('index')
})

app.get('/problem',(req,res,next)=>{

    var topic_alg = req.query.topic_alg
    var topic_tri = req.query.topic_tri
    var topic_geo = req.query.topic_geo
    var topic_ari = req.query.topic_ari
    var calculator = req.query.calculator
    var answer = req.query.answer
    var chart = req.query.chart
    var length = req.query.length
    

    if (topic_alg)
    {
        session_res = session_res.filter(
        function(session_res){ return session_res.topics_algebra == topic_alg }
        );

    }
    if (topic_tri)
    {
        session_res = session_res.filter(
        function(session_res){ return session_res.topics_trignometry == topic_tri }
        );

    }
    if (topic_ari)
    {
        session_res = session_res.filter(
        function(session_res){ return session_res.topics_arithmetic == topic_ari }
        );

    }
    if (topic_geo)
    {
        session_res = session_res.filter(
        function(session_res){ return session_res.topics_geometry == topic_geo }
        )

    }
    if (calculator && calculator!= 'All')
    {
        console.log(calculator)
        session_res = session_res.filter(
        function(session_res){ return session_res.calculator == calculator }
        )

    }
    if (answer && answer!= 'All')
    {
        session_res = session_res.filter(
        function(session_res){ return session_res.answer_type == answer }
        )

    }
    if (chart && chart!= 'All')
    {
        session_res = session_res.filter(
        function(session_res){ return session_res.answer_type == chart }
        )

    }
    if (length && length!= 'All')
    {
        session_res = results.filter(
        function(results){ return results.length == length }
        )

    }
    
    
    res.render('problems', { results: session_res});
    session_res = results
});

app.get('/problem/:id',(req,res,next)=>{
    var id = req.params.id;

    let query = problem.where('question_id', '==', id).get()
        .then(snapshot => {
            if (snapshot.empty) {
            console.log('No matching documents.');
            return;
            }  
            snapshot.forEach(doc => {
            question = doc.data()
            res.render('problem', { 
                title: question.question_id, 
                question_title: question.question_title,
                question_text: question.question_text, 
                hashtags: question.hashtags })
            });
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });

})

app.post('/problem/:id',(req,res,next)=>{
    var id = req.params.id;
    var answer = req.body.answer
    var sessionCookie = req.cookies.session || '';

    let query = problem.where('question_id', '==', id).get()
        .then(snapshot => {
            snapshot.forEach(doc => {
            question = doc.data()
            
            });
        })
    
    firebase.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
        .then(function(decodedClaims) {
        let uid = decodedClaims.uid;
        let user = db.collection('users').doc(uid);
        user.get().then((docData) => {
            correct = docData.data().correct
            complete = docData.data().complete
            if (question.answer == answer){
                db.collection('users').doc(uid).update({'correct': correct+1,'complete': complete+1});
            }
            else {
                db.collection('users').doc(uid).update({'correct': correct,'complete': complete+1});
            }
        }).catch(function(error) {
          // Force user to login.
          res.redirect('/');
        });
    });

    res.render('problem', { 
        title: question.question_id, 
        question_title: question.question_title,
        question_text: question.question_text, 
        hashtags: question.hashtags })

})

// route which captures form details and sends it to your personal mail
app.post('/sendemail',(req,res,next)=>{
  
  console.log(req.body)
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'stephantechdev@gmail.com',//      'stephantechdev@gmail.com',//replace with your email
      pass: 'Jamming1'//replace with your password
    }
  }); 
  var mailOptions = {
    from: 'stephantechdev@gmail.com',//replace with your email
    to: ['astephanerasmus@gmail.com','hr@avancevl.com'],//replace with your email
    subject: `Contact name: ${req.body.name}`,
    html:`<h1>Contact details</h1>
          <h2> name:${req.body.name} </h2><br>
          <h2> email:${req.body.email} </h2><br>
          <h2> message:${req.body.message} </h2><br>`
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      res.send('error') // if error occurs send error as response to client
    } else {
      console.log('Email sent: ' + info.response);
      res.send('Sent Successfully')//if mail is sent successfully send Sent successfully as response
    }
  });
  res.redirect('/');
})

app.get('/user', function (req, res) {
    // Get session cookie.
    var sessionCookie = req.cookies.session || '';
    firebase.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
      .then(function(decodedClaims) {
        return serveContentForUser('/user', req, res, decodedClaims);
      }).catch(function(error) {
        res.redirect('/');
      });
  });

app.get('/user/:id', function (req, res) {
    var id = req.params.id;

    let query = db.collection('users').where('username', '==', id).get()
        .then(snapshot => {
            snapshot.forEach(doc => {
            user = doc.data()
            });
        })
    res.render('user', { 
        title: user.username, 
        username: user.username,
        email: user.email,
        correct: user.correct, 
        complete: user.complete,
        accuracy: (user.correct/user.complete)*100})
  });
  
  /** Get profile endpoint. */
app.get('/profile', function (req, res) {
    // Get session cookie.
    var sessionCookie = req.cookies.session || '';
    // Get the session cookie and verify it. In this case, we are verifying if the
    // Firebase session was revoked, user deleted/disabled, etc.
    firebase.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
      .then(function(decodedClaims) {
        // Serve content for signed in user.
        return serveContentForUser('/profile', req, res, decodedClaims);
      }).catch(function(error) {
        // Force user to login.
        res.redirect('/');
      });
  });

  /** Session login endpoint. */
  app.post('/sessionLogin', function (req, res) {
    // Get ID token and CSRF token.
    var idToken = req.body.idToken.toString();
    var csrfToken = req.body.csrfToken.toString();
    
    // Guard against CSRF attacks.
    if (!req.cookies || csrfToken !== req.cookies.csrfToken) {
      res.status(401).send('UNAUTHORIZED REQUEST!');
      return;
    }
    // Set session expiration to 5 days.
    var expiresIn = 60 * 60 * 24 * 5 * 1000;
    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.
    // We could also choose to enforce that the ID token auth_time is recent.
    firebase.auth().verifyIdToken(idToken).then(function(decodedClaims) {
      // In this case, we are enforcing that the user signed in in the last 5 minutes.
      //create user object in db to track answers
    let uid = decodedClaims.uid;
    let user = db.collection('users').doc(uid);
    user.get().then((docData) => {
        if (!docData.exists) {
            db.collection('users').doc(uid).set({
                'correct':0,
                'complete':0,
                'username': decodedClaims.name.toLowerCase().replace(/\s/g, '')+Math.floor(Math.random() * 101).toString(),
                'email': decodedClaims.email});
         }})

      if (new Date().getTime() / 1000 - decodedClaims.auth_time < 5 * 60) {
        return firebase.auth().createSessionCookie(idToken, {expiresIn: expiresIn});
      }
      throw new Error('UNAUTHORIZED REQUEST!');
    })
    .then(function(sessionCookie) {
      var options = {maxAge: expiresIn, httpOnly: true, secure: false /** to test in localhost */};
      res.cookie('session', sessionCookie, options);
      res.end(JSON.stringify({status: 'success'}));
    })
    .catch(function(error) {
      res.status(401).send('UNAUTHORIZED REQUEST!');
    });
    
  });
  
  /** User signout endpoint. */
  app.get('/logout', function (req, res) {
    // Clear cookie.
    var sessionCookie = req.cookies.session || '';
    res.clearCookie('session');
    // Revoke session too. Note this will revoke all user sessions.
    if (sessionCookie) {
      firebase.auth().verifySessionCookie(sessionCookie, true).then(function(decodedClaims) {
        return firebase.auth().revokeRefreshTokens(decodedClaims.sub);
      })
      .then(function() {
        // Redirect to login page on success.
        res.redirect('/');
      })
      .catch(function() {
        // Redirect to login page on error.
        res.redirect('/');
      });
    } else {
      // Redirect to login page when no session cookie available.
      res.redirect('/');
    }
  });

const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
const server = app.listen(port, function () {
    console.log('Server listening on port ' + port);
});
