//carregar modulos
const express = require('express');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const app = express();
const admin = require('./routes/admin');
const path = require('path');
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
require("./models/Postagem");
const Postagem = mongoose.model("postagens");
require("./models/Categoria");
const Categoria = mongoose.model("categorias");
const usuarios = require("./routes/usuario");
const passport = require('passport');
require("./config/auth")(passport);
//const db = require("./config/db");

//configurações 
//sessão
app.use(session({
    secret: "cursonode",
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize())
app.use(passport.session())

app.use(flash());
//middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null;
    next()
});
// body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// handlebars
app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
// mongoose
mongoose.Promise = global.Promise
mongoose.connect("mongodb+srv://pepita:2014@cluster0.gteiq.mongodb.net/blogapp?retryWrites=true&w=majority").then(() => {
    console.log("Conectado ao mongo")
}).catch((err) => {
    console.log("Erro ao se conectar: " + err)
});
//public
app.use(express.static(path.join(__dirname, "public")));

//definir rotas
app.get('/', (req, res) => {
    Postagem.find().populate("categoria").sort({ data: "desc" }).lean().then((postagens) => {
        res.render("index", { postagens: postagens })
    }).catch((err) => {
        req.flash("error_msg", "Erro interno")
        res.redirect("/404")
    })
});
app.get("/postagem/:slug", (req, res) => {
    Postagem.findOne({ slug: req.params.slug }).lean().then((postagem) => {
        if (postagem) {
            res.render("postagem/index", { postagem: postagem })
        } else {
            req.flash("error_msg", "Esta postagem não existe")
            res.redirect("/")
        }
    }).catch((err) => {
        req.flash("error_msg", "Erro interno")
        res.redirect("/")
    })
});
app.get("/categorias", (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("categorias/index", { categorias: categorias })
    }).catch((err) => {
        req.flash("error_msg", "Erro ao listar categorias")
        res.redirect("/")
    })
});
app.get("/categorias/:slug", (req, res) => {
    Categoria.findOne({ slug: req.params.slug }).lean().then((categoria) => {
        if (categoria) {
            Postagem.find({ categoria: categoria._id }).lean().then((postagens) => {
                res.render("categorias/postagens", { postagens: postagens, categoria: categoria })
            }).catch((err) => {
                req.flash("error_msg", "Erro ao listar os posts")
                res.redirect("/")
            })
        } else {
            req.flash("error_msg", "esta categoria não existe")
            res.redirect("/")
        }
    }).catch((err) => {
        req.flash("error_msg", "Erro ao carregar esta categoria")
        res.redirect("/")
    })
});
app.get("/404", (req, res) => {
    res.send("Erro 404")
});
app.use('/admin', admin);

app.use("/usuarios", usuarios);

const PORT = process.env.PORT || 8081
app.listen(PORT, () => {
    console.log('Rodando na porta 8081')
});