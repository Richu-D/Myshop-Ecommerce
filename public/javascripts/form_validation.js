const form = document.getElementById('form')

var nameErr = document.getElementById('name-error');
var emailErr = document.getElementById('email-error');
var phoneErr = document.getElementById('phone-error');
var passwordErr = document.getElementById('password-error');



function validateName(){
    var name = document.getElementById('username').value;
    nameErr.style.visibility = 'visible';

    if(name.length == 0) {
        nameErr.innerHTML = 'Name is required';
        return false;
    }


    if(!name.match(/^[A-Za-z]*$/)){
        nameErr.innerHTML = 'Enter Valid name';
        return false;

    }
    nameErr.innerHTML = ''; 
    nameErr.style.visibility = 'hidden';
    return true;
}

function validateEmail(){
    var email = document.getElementById('email').value;
    emailErr.style.visibility = 'visible';
    if(email.length == 0) {
        emailErr.innerHTML = 'Email is required';
        return false;
    }

    if(!email.match(/^[A-Za-z\._\-[0-9]*[@][A-Za-z]*[\.][a-z]{2,4}$/)){
        emailErr.innerHTML = 'Enter a valid email';
        return false;
    }
    emailErr.innerHTML = ""
    emailErr.style.visibility = 'hidden';
    return true
}

function validatePhone(){
    var phone = document.getElementById('phone-number').value;
    phoneErr.style.visibility = 'visible';
    if(phone.length == 0){
      phoneErr.innerHTML='Phone number is required';
      return false;
    }
    
    if(phone.length !== 10){
      phoneErr.innerHTML='Phone number should 10 digit';
      return false;
    }
    
    if(!phone.match(/^[0-9]{10}$/)){
      phoneErr.innerHTML = 'Phone number should be 10 digit';      
      return false;
    }
    phoneErr.style.visibility = 'hidden';
    return true;

}    

function validatePassword(){
    var password = document.getElementById('password').value;
    passwordErr.style.visibility = 'visible';
    if(password.length == 0){
        passwordErr.innerHTML='Password is required';
        return false;
      }
  
     if(password.length < 8) {
        passwordErr.innerHTML = 'Password is Atleast 8 characters';
        return false;
    }

    passwordErr.innerHTML = ""
    passwordErr.style.visibility = 'hidden';
    return true
}





form.addEventListener('submit',(e)=>{
   if(!validateName() || !validateEmail() || !validatePhone() || !validatePassword() ){
    e.preventDefault()
}


    
})
