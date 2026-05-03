const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

const dashboardRoutes = require('./routes/dashboard');
const taskRoutes = require('./routes/tasks');
const riskRoutes = require('./routes/risks');

app.get('/', (req, res) => res.redirect('/dashboard'));
app.use('/dashboard', dashboardRoutes);
app.use('/tasks', taskRoutes);
app.use('/risks', riskRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
