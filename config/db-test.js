require('dotenv').config()
require('./database')
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL);

const db = mongoose.connection;
db.on('connected', function () {
    console.log(`Connected to MongoDB ${db.name} at ${db.host}:${db.port}`);
});

const Pizza = require('../models/pizza')

console.log("Baking pizzas")

Pizza.create({
    id: 111111111111,
    name: "The Verace",
    type: "Prebuilt",
    price: 11
})

Pizza.create({
    id: 222222222222,
    name: "The Mexican Fiesta",
    type: "Prebuilt",
    meats: ["Pepperoni"],
    veggies: ["Green Peppers", "Jalapeno Peppers"],
    price: 14
})

Pizza.create({
    id: 333333333333,
    name: "The Mountain",
    type: "Prebuilt",
    meats: ["Ham"],
    veggies: ["Mushrooms"],
    price: 13
})

Pizza.create({
    id: 444444444444,
    name: "El Diablo",
    type: "Prebuilt",
    meats: ["Salami"],
    veggies: ["Green Peppers","Banana Peppers", "Jalapeno Peppers"],
    price: 15
})

Pizza.create({
    id: 555555555555,
    name: "The First Love",
    type: "Prebuilt",
    meats: ["Pepperoni", "Bacon"],
    veggies: ["Onions"],
    price: 14
})

Pizza.create({
    id: 666666666666,
    name: "The Cheesy",
    type: "Prebuilt",
    cheese: "Extra",
    meats: ["Sausage"],
    veggies: ["Green Olives"],
    price: 14
})

Pizza.create({
    id: 777777777777,
    name: "The Smelly",
    type: "Prebuilt",
    meats: ["Sausage"],
    veggies: ["Onions"],
    price: 13
})

Pizza.create({
    id: 888888888888,
    name: "The Italian Nightmare",
    type: "Prebuilt",
    meats: ["Ham"],
    veggies: ["Pineapple"],
    price: 13
})


console.log("Pizzas are ready")
