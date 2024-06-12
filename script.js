document.addEventListener('DOMContentLoaded',() =>{
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById("login-form");
    const logoutForm = document.getElementById("logout-form");
    if(registerForm){
    registerForm.addEventListener('submit',async(e) =>{
        e.preventDefault();

        const formData = new FormData(registerForm);
        const email = formData.get('email');
        const full_name = formData.get('full_name');
        const password = formData.get('password');
        const username = formData.get('username');

        try{
            const response = await fetch ('/register',{
                method:'POST',
                headers:{
                    'Content-Type' : 'application/json'
                },
                body:JSON.stringify({email,full_name,password,username})
                
            });
            if(response.ok){
               alert('Registration successful');
               console.log('Registration successful');
               
            }else{
                alert('Registration failed');
            }
        }catch(error){
            console.error('Error',error);
        }
    });
}
    // login 
    if(loginForm){
    loginForm.addEventListener('submit',async(e) =>{
        e.preventDefault();

        const formData = new FormData (loginForm );
        const username = formData.get('username');
        const password = formData.get('password');

        try{
            const response = await fetch('/login',{
                method: 'POST',
                headers:{
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({username,password})
            });
            if(response.ok){
                const result = await response.json();
                if(result.success){
                    alert('login successful');
                    console.log('login was successful');
                    window.location.href = result.redirectUrl;
                }else{
                    const result = await response.json();
                    alert(result.message);
                    console.log('login failed',result.message);
                }
            }
        }catch(err){
                console.error('Error',err);
            }
    });
}

if(logoutForm){
    logoutForm.addEventListener('submit',async(e) =>{
        e.preventDefault();
        try{
            const response = await fetch ('/logout',{
                method:'POST'
            });
            if(response.ok){
                alert('logout successful');
                window.location.href = '/';
            }else{
                alert('failed to logout!');
            }
        }catch(err){
            console.error('Error',err);
        }
    });
}
const cropForm = document.getElementById('crop-form');
if(cropForm){
document.getElementById('crop-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const crop_name = document.getElementById('crop_name').value;
    const area = document.getElementById('area').value;
    const cost = document.getElementById('cost').value;
    const projected_yield = document.getElementById('projected_yield').value;
    const market_price = document.getElementById('market_price').value;

    const cropData = { crop_name, area, cost, projected_yield, market_price };

    fetch('/api/crops', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(cropData)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById('crop-form').reset();
        loadAnalysis();
    })
    .catch(err =>{
        console.error('Error:',err);
    });
});
}
    loadAnalysis();

    
});




function loadAnalysis() {
    fetch('/api/analysis')
    .then(response => response.json())
    .then(data => {
        console.log('Analysis data:',data);
        const analysisDiv = document.getElementById('analysis');
        if(analysisDiv){
        analysisDiv.innerHTML = '';

        data.forEach(crop => {
            const cropInfo = document.createElement('div');
            cropInfo.innerHTML = `
                <p>Crop: ${crop.crop_name}</p>
                <p>Area: ${crop.area} acres</p>
                <p>Cost: Ksh.${crop.cost}</p>
                <p>Projected Yield: ${crop.projected_yield} kg</p>
                <p>Market Price: Ksh.${crop.market_price}/kg</p>
                <p>Revenue: Ksh.${crop.revenue}</p>
                <p>Profit: Ksh.${crop.profit}</p>
                <hr>
            `;
            analysisDiv.appendChild(cropInfo);
        });
    }
    })
    .catch(err =>{
        console.error('Error:',err);
    });
}
// Load analysis on page load
//document.addEventListener('DOMContentLoaded', loadAnalysis);
