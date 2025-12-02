let isSubmitting = false;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.customer.register form');

    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        
        if (isSubmitting) return;
        
        isSubmitting = true;
        await handleRegistration(form);
        isSubmitting = false;
    });
});

async function handleRegistration(form) {
    const formData = new FormData(form);
    const data = {
        firstName: formData.get('customer[first_name]'),
        lastName: formData.get('customer[last_name]'),
        email: formData.get('customer[email]'),
        password: formData.get('customer[password]')
    };

    lockForm(form, true);
    clearMessages();

    try {
        const response = await createCustomer(data);
        
        if (response.data && response.data.customerCreate) {
            const result = response.data.customerCreate;
            
            if (result.customerUserErrors && result.customerUserErrors.length > 0) {
                displayErrorMessage(result.customerUserErrors);
            } else if (result.customer) {
                displaySuccessMessage('Account created successfully!');
            }
        } else {
            throw new Error('Unexpected response format');
        }
    } catch (error) {
        displayErrorMessage([{ message: 'An error occurred during registration. Please try again.' }]);
    } finally {
        lockForm(form, false);
    }
}

async function createCustomer(data) {
    const mutation = `
        mutation customerCreate($input: CustomerCreateInput!) {
            customerCreate(input: $input) {
                customer {
                    firstName
                    lastName
                    email
                }
                customerUserErrors {
                    field
                    message
                }
            }
        }
    `;

    const variables = {
        input: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password
        }
    };

    if (!window.Shopify || !window.Shopify.storefrontAccessToken) {
        throw new Error('Storefront API access token is not configured');
    }

    const response = await fetch(`https://${window.Shopify.shop}/api/2025-10/graphql.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Shopify-Storefront-Access-Token': window.Shopify.storefrontAccessToken
        },
        body: JSON.stringify({
            query: mutation,
            variables: variables
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
}

function lockForm(form, lock) {
    const inputs = form.querySelectorAll('input, button');
    inputs.forEach(input => {
        input.disabled = lock;
    });
    
    const submitButton = form.querySelector('button[type="submit"], button:not([type])');
    if (submitButton) {
        if (lock) {
            submitButton.setAttribute('data-original-text', submitButton.textContent);
            submitButton.textContent = 'Processing...';
            submitButton.style.opacity = '0.6';
            submitButton.style.cursor = 'not-allowed';
        } else {
            const originalText = submitButton.getAttribute('data-original-text');
            if (originalText) {
                submitButton.textContent = originalText;
            }
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
        }
    }
}

function displaySuccessMessage(message) {
    const container = document.getElementById('registration-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'notification-message success';
    messageElement.setAttribute('role', 'status');
    messageElement.setAttribute('tabindex', '-1');
    messageElement.textContent = message;
    
    container.appendChild(messageElement);
    messageElement.focus();
    
    setTimeout(() => {
        messageElement.remove();
    }, 4000);
}

function displayErrorMessage(errors) {
    const container = document.getElementById('registration-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'notification-message error';
    messageElement.setAttribute('role', 'alert');
    messageElement.setAttribute('tabindex', '-1');
    
    if (errors.length === 1) {
        messageElement.textContent = errors[0].message;
    } else {
        const errorList = errors.map(error => `<li>${error.message}</li>`).join('');
        messageElement.innerHTML = `<ul>${errorList}</ul>`;
    }
    
    container.appendChild(messageElement);
    messageElement.focus();
    
    setTimeout(() => {
        messageElement.remove();
    }, 4000);
}

function clearMessages() {
    const container = document.getElementById('registration-messages');
    if (container) {
        container.innerHTML = '';
    }
}
