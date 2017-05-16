//setup global object to store userid and email and other global values
var app = {
  userid: '',
  useremail: '',
  username: '',
  useraccountstatus: '',
  view: ''
}

//----------CONTROLLING FORMS
function formController() {
  if (app.userid) {
    //hide both forms
    app.signin.classList.add('hide');
    app.signup.classList.add('hide');
  } else {
    app.signin.classList.remove('hide');
    app.signup.classList.add('hide');
  }
}
//hide and show sign up and sign in
function toggleForms() {
  var forms = document.getElementsByClassName('auth-ui');
  for (i = 0; i < forms.length; i++) {
    if (forms[i].classList.contains('hide')) {
      forms[i].classList.remove('hide');
    } else {
      forms[i].classList.add('hide');
    }
  }
}
//hide and show profile form
function toggleProfile(){
  if(app.userid){
    if(app.profile.classList.contains('hide')){
      app.profile.classList.remove('hide');
      getProfileData();
      document.getElementById('profile-close').addEventListener('click',toggleProfile);
    }
    else{
      app.profile.classList.add('hide');
    }
  }
 
}
//populate profile form
function getProfileData(){
  if(app.userid){
    document.getElementById('profile-email').value = app.useremail;
    document.getElementById('profile-password').value = 'password';
    document.getElementById('profile-name').value = app.username;
  }
}
//----------------MAIN MENU
function menuController() {
  //if user is logged in
  if (app.userid) {
    //show logout link
    document.getElementById('logoutbtn').classList.remove('hide');
    document.getElementById('profilebtn').classList.remove('hide');
  } else {
    //hide logout link
    document.getElementById('logoutbtn').classList.add('hide');
    document.getElementById('profilebtn').classList.add('hide');
  }
}

//-----------INITIALIZE APP UI

window.addEventListener('load', onWindowLoad);


function onWindowLoad() {
  //when window loads bind ui to listeners
  bindUI();
}

function bindUI() {
  //get a reference to the sign in form and store it in global app object
  //for easy access
  app.signin = document.getElementById('signin');
  //listen to submit event from the login form
  app.signin.addEventListener('submit', signUserIn);

  //get a reference to the sign up form
  app.signup = document.getElementById('signup');
  //listen to submit event from the signup form
  app.signup.addEventListener('submit', signUserUp);
  
  //get a reference to the profile form
  app.profile = document.getElementById('profile');
  //get a reference to profile button
  profilebtn = document.getElementById('profilebtn');
  profilebtn.addEventListener('click',toggleProfile);

  //get a reference to the logout button
  app.logout = document.getElementById('logoutbtn');
  app.logout.addEventListener('click', logUserOut);

  //add a listener for the task form
  var taskform = document.getElementById('task-form');
  taskform.addEventListener('submit', addTask);

  //add listener to toggle forms
  var formtoggles = document.getElementsByClassName('auth-ui');
  for (t = 0; t < formtoggles.length; t++) {
    link = formtoggles[t].getElementsByClassName('form-toggle');
    link[0].addEventListener('click', toggleForms);
  }

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in.
      app.userid = user.uid;
      app.useremail = user.email;
      formController();
      menuController();
      getUserName(user.uid);
      readTasks(user.uid);

    } else {
      // User is signed out.
      // put things to do here when the user is signed out
      app.userid = '';
      app.email = '';
      formController();
      menuController();
      emptyTasks();
    }
  });
}

//-------------AUTHENTICATION
function signUserUp(event) {
  //stop the form from refreshing page by cancelling the event
  event.preventDefault();
  //get value of email from sign up form
  var email = document.getElementById('signup-email').value;
  //get the password
  var password = document.getElementById('signup-password').value;
  //username
  var username = document.getElementById('signup-name').value;
  //sign user up with email and password
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function () {
      //reset the form
      event.target.reset();
      //get the id of the user
      var userid = firebase.auth().currentUser.uid;
      //write username to database using user.id as key, under users branch
      var ref = 'users/' + userid;
      var obj = {
        name: username
      };
      //set username in app
      app.username = username;
      writeData(ref, obj);
    })
    .catch(function (error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorMessage);
    });
}

function signUserIn(event) {
  //stop the form from refreshing page by cancelling the event
  event.preventDefault();
  //get value of email from sign in form
  var email = document.getElementById('signin-email').value;
  //get value of password from sign in form
  var password = document.getElementById('signin-password').value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function () {
      //empty the form
      document.getElementById('signin-form').reset();
      //get user id
      var userid = firebase.auth().currentUser.uid;
      //get user name
      getUserName(userid);
      //get tasks
      readTasks(userid);
    })
    .catch(function (error) {
      notifyUser(error.message);
    });
}

function logUserOut() {
  firebase.auth().signOut().then(function () {
    notifyUser('');
    emptyTasks();
  }).catch(function (error) {
    notifyUser(error.message);
  });
}
//read username from firebase
function getUserName(userid){
  firebase.database().ref('users/' + userid).once('value')
  .then(function (snapshot) {
    var username = snapshot.val().name;
    //greet user by printing username in notifications area
    notifyUser(username);
    //set username in app
    app.username = username;
  });
}
//display notifications
function notifyUser(msg) {
  document.getElementById('message').innerHTML = msg;
}

//read tasks from Firebase
function readTasks(id) {
  //create reference to the branch with tasks
  firebase.database().ref('tasks/' + id).once('value')
    .then(function (snapshot) {
      var tasks = snapshot.val();
      var taskcount = Object.keys(tasks).length;
      renderTasks(tasks);
    })
    .catch(function (error) {
      console.log(error.message);
    });
}

//render task from Firebase to the UI
function renderTasks(dataobj) {
  //empty task list
  emptyTasks();
  //get the length of tasks
  var count = Object.keys(dataobj).length;
  var keys = Object.keys(dataobj);
  var vals = Object.values(dataobj);
  //loop through the tasks
  var i=0;
  for(i=0;i<count;i++){
    //keys for task is the timestamp, used as id on display
    var taskid = keys[i];
    var name = vals[i].taskname;
    var status = vals[i].status;
    //clone the template
    var template = document.getElementById('task-template').content.cloneNode(true);
    template.querySelector('li .task-name').innerText = name;
    template.querySelector('li .task-buttons button').setAttribute('data-id', taskid)
    template.querySelector('li').setAttribute('id',taskid);
    template.querySelector('li').setAttribute('data-status',status);
    document.getElementById("task-list").appendChild(template);
  }
}
//empty the task list (on logout and when user is not signed in)
function emptyTasks(){
  //empty the task list
  document.getElementById('task-list').innerHTML='';
}

function addTask(event) {
  //stop form from refreshing page by cancelling the event default
  event.preventDefault();
  //get the value of the input
  var task = document.getElementById('task-input').value;
  //empty the form
  event.target.reset();
  //create id for task using timestamp
  var taskid = new Date().getTime();
  //write data to firebase using firebase.database object
  //write tasks to "tasks" branch, use userid as key and taskid as key
  //for each task
  var dataref = 'tasks/' + app.userid + '/' + taskid;
  var dataobj = {
    taskname: task,
    status: 0
  };
  writeData(dataref, dataobj);
}

function writeData(ref, obj) {
  firebase.database().ref(ref).set(obj)
    .then(function (result) {
      console.log(result);
    });
}