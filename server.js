const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// СЮДА ВСТАВЬТЕ ВАШУ СТРОКУ ПОДКЛЮЧЕНИЯ ИЗ MONGODB ATLAS
const MONGO_URI = 'mongodb+srv://ВАШ_ЛОГИН:ВАШ_ПАРОЛЬ@cluster.xxxx.mongodb.net/board?retryWrites=true&w=majority';

// Настройки Express
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Подключение к облачной базе данных
mongoose.connect(MONGO_URI)
    .then(() => console.log('Успешно подключено к MongoDB Atlas!'))
    .catch(err => console.error('Ошибка подключения к базе:', err));

// Схема поста в базе данных
const PostSchema = new mongoose.Schema({
    title: String,
    message: String,
    image: String, // Картинка будет храниться в формате Base64
    timestamp: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', PostSchema);

// Главная страница сайта (HTML + CSS + JS)
app.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ timestamp: -1 });
        
        let postsHtml = posts.map(p => `
            <div class="thread">
                <div class="meta"><strong>${p.title || 'Аноним'}</strong> [${new Date(p.timestamp).toLocaleString()}]</div>
                ${p.image ? `<a href="${p.image}" target="_blank"><img class="thumb" src="${p.image}"></a>` : ''}
                <p style="white-space: pre-wrap;">${p.message}</p>
                <div class="clear"></div>
            </div>
        `).join('');

        if (posts.length === 0) {
            postsHtml = "<p style='color: #666;'>Здесь пока нет ни одного треда. Будьте первым!</p>";
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Облачный Имиджборд</title>
                <style>
                    body { font-family: Arial, sans-serif; background: #eef2ffd9; color: #333; margin: 20px; }
                    .form-box { background: #d6daf0; padding: 15px; border-radius: 5px; max-width: 500px; margin-bottom: 20px; border: 1px solid #b7bcda; }
                    .thread { background: #d6daf0; padding: 15px; margin-bottom: 20px; border-radius: 5px; border-left: 5px solid #34345c; }
                    .thumb { max-width: 150px; max-height: 150px; display: block; margin: 5px 0; float: left; margin-right: 15px; border: 1px solid #777; background: #fff; }
                    .meta { font-size: 0.85em; color: #555; margin-bottom: 5px; }
                    .clear { clear: both; }
                    input, textarea { width: 100%; margin-bottom: 10px; box-sizing: border-box; padding: 5px; }
                    button { background: #34345c; color: #fff; border: none; padding: 8px 15px; border-radius: 3px; cursor: pointer; }
                    button:hover { background: #4a4a7d; }
                    h1 a { color: #34345c; text-decoration: none; }
                </style>
            </head>
            <body>
                <h1><a href="/">анонимная облачная борда</a></h1>
                <div class="form-box">
                    <h3>Создать новый пост</h3>
                    <form action="/create" method="POST" id="postForm">
                        <input type="text" name="title" placeholder="Тема (не обязательно)">
                        <textarea name="message" rows="4" placeholder="Текст сообщения *" required></textarea>
                        <input type="file" id="imageFile" accept="image/*">
                        <input type="hidden" name="image" id="imageBase64">
                        <button type="submit">Отправить пост</button>
                    </form>
                </div>
                <hr>
                <div id="board">${postsHtml}</div>

                <script>
                    const fileInput = document.getElementById('imageFile');
                    const base64Input = document.getElementById('imageBase64');

                    fileInput.addEventListener('change', function() {
                        const file = fileInput.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = function() {
                                base64Input.value = reader.result;
                            }
                            reader.readAsDataURL(file);
                        }
                    });
                </script>
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send("Ошибка сервера: " + err.message);
    }
});

// Обработка создания поста
app.post('/create', async (req, res) => {
    try {
        const { title, message, image } = req.body;
        if (message || image) {
            const newPost = new Post({ title, message, image });
            await newPost.save();
        }
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Ошибка сохранения: " + err.message);
    }
});

app.listen(PORT, () => {
    console.log('Сервер запущен!');
});
