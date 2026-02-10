
const Auth = {
    register: (name, email, password) => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email already registered' };
        }
        users.push({ name, email, password });
        localStorage.setItem('users', JSON.stringify(users));
        return { success: true };
    },

    login: (email, password) => {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true };
        }
        return { success: false, message: 'Invalid credentials' };
    },

    logout: () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('currentUser'));
    },

    checkAuth: (redirectIfNot = false) => {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user && redirectIfNot) {
            window.location.href = 'index.html';
        }
        return user;
    }
};
