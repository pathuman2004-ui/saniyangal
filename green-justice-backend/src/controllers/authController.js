const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function loginAuthority(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await pool.query('SELECT * FROM authorities WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const authority = rows[0];
    const matched = await bcrypt.compare(password, authority.password_hash);
    if (!matched) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: authority.id,
        email: authority.email,
        role: authority.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      authority: {
        id: authority.id,
        name: authority.name,
        email: authority.email,
        role: authority.role,
        department: authority.department
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createAuthority(req, res, next) {
  try {
    const { name, email, password, department, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const [exists] = await pool.query('SELECT id FROM authorities WHERE email = ?', [email]);
    if (exists.length > 0) {
      return res.status(400).json({ message: 'Authority email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO authorities (name, email, password_hash, department, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, department || null, role === 'admin' ? 'admin' : 'authority']
    );

    res.status(201).json({
      message: 'Authority account created',
      authority_id: result.insertId
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { loginAuthority, createAuthority };
