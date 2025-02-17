document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');
    const userTypeSelect = document.getElementById('userType');
    const emailFields = document.querySelectorAll('.email-field');
    const workerIdField = document.querySelector('.worker-id-field');

    // Form switch animation
    function switchForm(hideForm, showForm) {
        hideForm.style.opacity = '0';
        hideForm.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            hideForm.classList.remove('active');
            showForm.classList.add('active');
            
            setTimeout(() => {
                showForm.style.opacity = '1';
                showForm.style.transform = 'translateY(0)';
            }, 50);
        }, 300);
    }

    // Event Listeners for form switching
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(loginForm, signupForm);
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm(signupForm, loginForm);
    });

    // Handle user type changes
    userTypeSelect.addEventListener('change', () => {
        const isWorker = userTypeSelect.value === 'worker';
        
        emailFields.forEach(field => {
            field.style.display = isWorker ? 'none' : 'block';
        });
        
        if (workerIdField) {
            workerIdField.style.display = isWorker ? 'block' : 'none';
        }
    });

    // Form submission handling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Add your form submission logic here
            console.log('Form submitted:', form.closest('.form-container').id);
        });
    });
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Login successful!');
            localStorage.setItem('token', data.token); // Save the JWT token for further authenticated requests
            window.location.href = './student-dashboard.html'
        } else {
            alert(`Login failed: ${data.error}`);
        }
    } catch (err) {
        console.error('Error during login:', err);
    }
});


document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password, user_type: 'student' }),
        });

        const data = await response.json();
        if (response.ok) {
            alert('Signup successful! Please log in.');
        } else {
            alert(`Signup failed: ${data.error}`);
        }
    } catch (err) {
        console.error('Error during signup:', err);
    }
});
