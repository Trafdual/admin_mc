const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const app = express();

const API_BASE_URL = 'https://api.hieuphungfpt.sbs/api'; // Đã xác nhận đúng

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
  secret: 'hieuphung666',
  resave: false,
  saveUninitialized: false,
}));

// Middleware kiểm tra đăng nhập
const requireLogin = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    return res.redirect('/login');
  }
  next();
};

// Route: Trang gốc
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Route: Trang đăng nhập
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'hieuphung666') {
    req.session.isLoggedIn = true;
    res.redirect('/admin');
  } else {
    res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu' });
  }
});

// Route: Trang admin
app.get('/admin', requireLogin, async (req, res) => {
  try {
    const usersResponse = await axios.get(`${API_BASE_URL}/users`);
    const plansResponse = await axios.get(`${API_BASE_URL}/plans`);
    res.render('admin', {
      users: usersResponse.data,
      plans: plansResponse.data,
      activeTab: req.query.tab || 'users',
      error: null,
    });
  } catch (error) {
    console.error('Lỗi chi tiết:', error.message, error.response?.data);
    res.render('admin', {
      users: [],
      plans: [],
      activeTab: req.query.tab || 'users',
      error: `Lỗi khi tải dữ liệu: ${error.message}`,
    });
  }
});

// Route: Form thêm user
app.get('/admin/users/add', requireLogin, (req, res) => {
  res.render('user-add', { error: null });
});

// Route: Refresh Expiration cho tất cả users
app.post('/admin/users/refresh-expiration', requireLogin, async (req, res) => {
  try {
    // Gọi API refresh expiration từ backend (http://localhost:5000/api/users/refresh-expiration)
    await axios.post(`${API_BASE_URL}/users/refresh-expiration`); //Hoặc get tùy backend
    res.redirect('/admin?tab=users'); // Chuyển hướng về trang admin sau khi refresh
  } catch (error) {
    console.error('Lỗi refresh expiration:', error.message, error.response?.data);
    res.redirect('/admin?tab=users&error=Lỗi khi refresh expiration'); // Chuyển hướng kèm thông báo lỗi
  }
});

app.post('/admin/users/add', requireLogin, async (req, res) => {
  try {
    await axios.post(`${API_BASE_URL}/users`, {
      action: 'create',
      ...req.body,
    });
    res.redirect('/admin?tab=users');
  } catch (error) {
    console.error('Lỗi thêm user:', error.message, error.response?.data);
    res.render('user-add', { error: 'Lỗi khi thêm user' });
  }
});

// Route: Form sửa user
app.get('/admin/users/edit/:id', requireLogin, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`);
    const user = response.data.find(u => u._id === req.params.id);
    if (!user) throw new Error('User không tồn tại');
    res.render('user-edit', { user, error: null });
  } catch (error) {
    console.error('Lỗi tải user:', error.message);
    res.redirect('/admin?tab=users&error=Lỗi khi tải user');
  }
});

app.post('/admin/users/edit/:id', requireLogin, async (req, res) => {
  try {
    await axios.post(`${API_BASE_URL}/users`, {
      action: 'update',
      id: req.params.id,
      ...req.body,
    });
    res.redirect('/admin?tab=users');
  } catch (error) {
    console.error('Lỗi sửa user:', error.message, error.response?.data);
    res.render('user-edit', { user: req.body, error: 'Lỗi khi sửa user' });
  }
});

// Route: Xóa user
app.post('/admin/users/delete', requireLogin, async (req, res) => {
  try {
    await axios.post(`${API_BASE_URL}/users`, {
      action: 'delete',
      id: req.body.id,
    });
    res.redirect('/admin?tab=users');
  } catch (error) {
    console.error('Lỗi xóa user:', error.message, error.response?.data);
    res.redirect('/admin?tab=users&error=Lỗi khi xóa user');
  }
});

// Route: Form thêm plan
app.get('/admin/plans/add', requireLogin, (req, res) => {
  res.render('plan-add', { error: null });
});

app.post('/admin/plans/add', requireLogin, async (req, res) => {
  try {
    await axios.post(`${API_BASE_URL}/plans`, {
      action: 'create',
      ...req.body,
    });
    res.redirect('/admin?tab=plans');
  } catch (error) {
    console.error('Lỗi thêm plan:', error.message, error.response?.data);
    res.render('plan-add', { error: 'Lỗi khi thêm plan' });
  }
});

// Route: Form sửa plan
app.get('/admin/plans/edit/:id', requireLogin, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/plans`);
    const plan = response.data.find(p => p._id === req.params.id);
    if (!plan) throw new Error('Plan không tồn tại');
    res.render('plan-edit', { plan, error: null });
  } catch (error) {
    console.error('Lỗi tải plan:', error.message);
    res.redirect('/admin?tab=plans&error=Lỗi khi tải plan');
  }
});

app.post('/admin/plans/edit/:id', requireLogin, async (req, res) => {
  try {
    await axios.post(`${API_BASE_URL}/plans`, {
      action: 'update',
      id: req.params.id,
      ...req.body,
    });
    res.redirect('/admin?tab=plans');
  } catch (error) {
    console.error('Lỗi sửa plan:', error.message, error.response?.data);
    res.render('plan-edit', { plan: req.body, error: 'Lỗi khi sửa plan' });
  }
});

// Route: Xóa plan
app.post('/admin/plans/delete', requireLogin, async (req, res) => {
  try {
    await axios.post(`${API_BASE_URL}/plans`, {
      action: 'delete',
      id: req.body.id,
    });
    res.redirect('/admin?tab=plans');
  } catch (error) {
    console.error('Lỗi xóa plan:', error.message, error.response?.data);
    res.redirect('/admin?tab=plans&error=Lỗi khi xóa plan');
  }
});

// Route: Đăng xuất
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Khởi động server
const PORT = 3091;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});