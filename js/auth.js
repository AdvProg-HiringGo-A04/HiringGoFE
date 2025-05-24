import CONFIG from "./config.js";

document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab');
    const forms = document.querySelectorAll('.form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            loginForm.reset();
            registerForm.reset();
            
            document.querySelectorAll('.error-message, .success-message').forEach(msg => {
                msg.style.display = 'none';
            });
            
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            tab.classList.add('active');
            const formId = tab.getAttribute('data-tab') + 'Form';
            document.getElementById(formId).classList.add('active');
        });
    });
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        document.querySelectorAll('#loginForm .error-message, #loginForm .success-message').forEach(msg => {
            msg.style.display = 'none';
        });
        
        if (!isValidEmail(email)) {
            document.getElementById('loginEmailError').textContent = 'Email tidak valid';
            document.getElementById('loginEmailError').style.display = 'block';
            return;
        }
        
        if (password.length < 6) {
            document.getElementById('loginPasswordError').textContent = 'Password minimal 6 karakter';
            document.getElementById('loginPasswordError').style.display = 'block';
            return;
        }
        
        document.getElementById('loginButton').querySelector('span').style.display = 'none';
        document.getElementById('loginLoader').style.display = 'block';
        
        login(email, password);
    });
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const npm = document.getElementById('registerNpm').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        document.querySelectorAll('#registerForm .error-message, #registerForm .success-message').forEach(msg => {
            msg.style.display = 'none';
        });
        
        if (name.length < 3) {
            document.getElementById('registerNameError').textContent = 'Nama minimal 3 karakter';
            document.getElementById('registerNameError').style.display = 'block';
            return;
        }
        
        if (npm.length !== 10) {
            document.getElementById('registerNpmError').textContent = 'NPM harus 10 karakter';
            document.getElementById('registerNpmError').style.display = 'block';
            return;
        }
        
        if (!isValidEmail(email)) {
            document.getElementById('registerEmailError').textContent = 'Email tidak valid';
            document.getElementById('registerEmailError').style.display = 'block';
            return;
        }
        
        if (password.length < 6) {
            document.getElementById('registerPasswordError').textContent = 'Password minimal 6 karakter';
            document.getElementById('registerPasswordError').style.display = 'block';
            return;
        }
        
        if (password !== confirmPassword) {
            document.getElementById('registerConfirmPasswordError').textContent = 'Password tidak cocok';
            document.getElementById('registerConfirmPasswordError').style.display = 'block';
            return;
        }
        
        document.getElementById('registerButton').querySelector('span').style.display = 'none';
        document.getElementById('registerLoader').style.display = 'block';
        
        register(name, npm, email, password, confirmPassword);
    });
    
    checkAuth();
});

function login(email, password) {
    console.log("Mengirim request login ke:", `${CONFIG.API_URL}/auth/login`);

    fetch(`${CONFIG.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        console.log("Status response:", response.status);
        
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || `Error: ${response.status}`);
            }).catch(err => {
                if (err instanceof SyntaxError) {
                    throw new Error(`Server error (${response.status})`);
                }
                throw err;
            });
        }
        
        return response.json();
    })
    .then(data => {
        console.log("Response sukses:", data);
        
        document.getElementById('loginButton').querySelector('span').style.display = 'block';
        document.getElementById('loginLoader').style.display = 'none';
        
        const token = data.data.token;
        
        if (!token) {
            document.getElementById('loginError').textContent = 'Login gagal. Token tidak ditemukan.';
            document.getElementById('loginError').style.display = 'block';
        } else {
            document.getElementById('loginSuccess').textContent = 'Login berhasil!';
            document.getElementById('loginSuccess').style.display = 'block';
            
            localStorage.setItem('token', token);

            window.location.href = 'dashboard.html';
        }
    })
    .catch(error => {
        console.error("Login error:", error);
        
        document.getElementById('loginButton').querySelector('span').style.display = 'block';
        document.getElementById('loginLoader').style.display = 'none';
        
        document.getElementById('loginError').textContent = error.message || 'Login gagal. Email atau password salah.';
        document.getElementById('loginError').style.display = 'block';
    });
}

function register(name, npm, email, password, confirmPassword) {
    console.log("Mengirim request registrasi ke:", `${CONFIG.API_URL}/auth/register`);
    console.log("Data yang dikirim:", { 
        namaLengkap: name, 
        npm: npm, 
        email: email, 
        password: password,
        confirmPassword: confirmPassword
    });

    fetch(`${CONFIG.API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            namaLengkap: name, 
            npm: npm,
            email: email, 
            password: password,
            confirmPassword: confirmPassword
        })
    })
    .then(response => {
        console.log("Status response:", response.status);
        
        return response.text().then(text => {
            try {
                const data = JSON.parse(text);
                console.log("Response body:", data);
                
                if (!response.ok) {
                    let errorMessage = 'Error melakukan registrasi';
                    
                    if (data.message) {
                        errorMessage = data.message;
                    } else if (data.error) {
                        errorMessage = data.error;
                    } else if (data.data && typeof data.data === 'string') {
                        errorMessage = data.data;
                    }
                    
                    throw new Error(errorMessage);
                }
                
                return data;
            } catch (e) {
                if (e instanceof SyntaxError) {
                    console.log("Response bukan JSON:", text);
                    if (!response.ok) {
                        throw new Error(`Server error (${response.status}): ${text}`);
                    }
                    return { rawText: text };
                }
                throw e;
            }
        });
    })
    .then(data => {
        console.log("Response sukses:", data);
        
        document.getElementById('registerButton').querySelector('span').style.display = 'block';
        document.getElementById('registerLoader').style.display = 'none';
        
        document.getElementById('registerSuccess').textContent = 'Registrasi berhasil! Silakan login.';
        document.getElementById('registerSuccess').style.display = 'block';
        
        document.getElementById('registerForm').reset();
        
        setTimeout(() => {
            document.querySelectorAll('.tab')[0].click();
        }, 2000);
    })
    .catch(error => {
        console.error("Register error:", error);
        
        document.getElementById('registerButton').querySelector('span').style.display = 'block';
        document.getElementById('registerLoader').style.display = 'none';
        
        document.getElementById('registerError').textContent = error.message || 'Terjadi kesalahan. Silakan coba lagi.';
        document.getElementById('registerError').style.display = 'block';
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'dashboard.html';
    }
}