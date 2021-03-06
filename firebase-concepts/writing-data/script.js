//setup global object to store userid and email
var app = {
	userid:'',
	useremail:''
}

window.addEventListener('load',onWindowLoad);
function onWindowLoad(){
	//get a reference to the sign in form
	let signin = document.getElementById('signin-form');
	//listen to submit event from the login form
	signin.addEventListener('submit',signUserIn);
	
	//add a listener for the sign out button
	let logoutbtn = document.getElementById('logoutbtn');
	logoutbtn.addEventListener('click',logUserOut);
	
	//add a listener for the task form
	let taskform = document.getElementById('task-form');
	taskform.addEventListener('submit',addTask);
}

function signUserIn(event){
	event.preventDefault();
	//var signindata = new FormData(event.target);
	//if on Safari, get form with
	let email = document.getElementById('email').value;
	let password = document.getElementById('password').value;
	firebase.auth().signInWithEmailAndPassword(email,password)
	.then(function(){
		//empty the form
		document.getElementById('signin-form').reset();
	})
	.catch(function(error){
		notifyUser(error.message);
	});
}

function logUserOut(){
	firebase.auth().signOut().then(function() {
		// user is signed out
		//show login button
		document.getElementById('loginbtn').style.visibility = 'visible';
		//hide logout button
		document.getElementById('logoutbtn').style.visibility = 'hidden';
	}).catch(function(error) {
		notifyUser(error.message);
	});
}


function notifyUser(msg){
	document.getElementById('message').val = msg;
}	

function addTask(event){
	//stop form from refreshing page by cancelling the event default
	event.preventDefault();
	//get the value of the input
	let task = document.getElementById('task-input').value;
	//empty the form
	event.target.reset();
	//create id for task using timestamp
	let taskid = new Date().getTime();
	//write data to firebase using firebase.database object
	//write tasks to "tasks" branch, use userid as key and taskid as key
	//for each task
	let dataref = 'tasks/' + app.userid + '/' + taskid;
	let dataobj = {taskname: task, status: 0};
	writeData(dataref,dataobj);
}

function writeData(ref,obj){
	firebase.database().ref(ref).set(obj)
	.then(function(result){
		console.log(result);
	});
}

function readData(id){
	firebase.database().ref('tasks/'+id).once('value')
	.then(function(snapshot) {
		let tasks = snapshot.val();
		let taskcount = Object.keys(tasks).length;
		console.log(Object.keys(tasks));
	});
}

function renderData(dataobj){

}

//firebase observer for user state
firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// User is signed in.
		notifyUser("Hello "+user.email);
		var uid = user.uid;
		app.userid = uid;
		app.useremail = user.email;
		// put things to do here when the user is signed in
		//hide the sign in form
		document.getElementById('signin-form').classList.add('hide');
		//hide the login button
		document.getElementById('loginbtn').style.visibility = 'hidden';
		//show the logout button
		document.getElementById('logoutbtn').style.visibility = 'visible';
		readData(app.userid);
	} 
	else {
		// User is signed out.
		// put things to do here when the user is signed out
		app.id = '';
		app.email = '';
		//show the login form
		document.getElementById('signin-form').classList.remove('hide');
	}
 });