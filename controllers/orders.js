const Order = require('../models/order');
const pizza = require('../models/pizza');
const Pizza = require('../models/pizza')
const { v4: uuidv4 } = require('uuid');

module.exports = {
    index,
    newBuild,
    createBuild,
    editBuild,
    saveBuild,
    show,
    deleteItem,
    editQuantity,
    checkout,
    handlePayment,
    addToCart,
}

async function index(req, res) {
    let order = {}
    if (req.cookies.orderId === undefined) {
        order = await Order.create({})
        res.cookie(`orderId`, `${order._id}`);
    } else {
        order = await Order.findById(req.cookies.orderId)
    }

    prebuiltPizzas = await Pizza.find({type: "Prebuilt"})
    
    res.render('order/index', { title: "Order",order, prebuiltPizzas })
}

async function newBuild(req, res, next) {
    const orderId = req.cookies.orderId
    const order = await Order.findById(orderId)
    res.render('builder/new', { title: "Deal Builder", order })
}

async function createBuild(req, res, next) {
    const pizzaData = { ...req.body }
    pizzaData.name = namePizza(pizzaData)
    pizzaData.price = pricePizza(pizzaData)
    const newPizza = await Pizza.create(pizzaData)
    const orderId = req.cookies.orderId
    const order = await Order.findById(orderId).populate('items.pizzas')
    order.items.pizzas.push(newPizza)
    order.total = calcTotal(order.items)
    order.save()
    res.redirect('/order')
}

async function editBuild(req, res) {
    const orderId = req.cookies.orderId
    const itemId = req.params.id
    const order = await Order.findById(orderId)
    const pizza = await Pizza.findById(itemId)
    res.render('builder/edit', { title: "Edit Deal", order,pizza })
    // TODO: check if side
}

async function saveBuild(req, res) {
    const orderId = req.cookies.orderId
    const itemId = req.params.id

    newPizza = {...req.body}
    newPizza.name = namePizza(newPizza)
    newPizza.price = pricePizza(newPizza)

    await Pizza.findOneAndUpdate(
        { _id: itemId },
        { $set:{
            size: newPizza.size,
            crust: newPizza.crust,
            sauce: newPizza.sauce,
            cut: newPizza.cut,
            cheese: newPizza.cheese,
            meats: newPizza.meats,
            veggies: newPizza.veggies,
            name: newPizza.name,
            price: newPizza.price
        }}
    )

    const order = await Order.findById(orderId).populate('items.pizzas') 
    order.total = calcTotal(order.items)
    order.save() 

    res.render('cart/index', { title: "Cart", order })
}

async function addToCart(req, res){
    const itemId = req.params.id
    const pizza = await Pizza.findById(itemId)
    const pizzaData = {...pizza._doc}
    pizzaData.type = "Custom"
    delete pizzaData._id
    delete pizzaData.createdAt
    delete pizzaData.updatedAt 
    delete pizzaData.__v
    newPizza = await Pizza.create(pizzaData)

    order = await Order.findById(req.cookies.orderId).populate('items.pizzas')
    order.items.pizzas.push(newPizza)
    order.total = calcTotal(order.items)
    order.save()

    prebuiltPizzas = await Pizza.find({type: "Prebuilt"})
    
    res.render('order/index', { title: "Order",order, prebuiltPizzas })
}

async function show(req, res) {
    let order = {}
    if (req.cookies.orderId === undefined) {
        order = await Order.create({})
        res.cookie(`orderId`, `${order._id}`);
    } else {
        order = await Order.findById(req.cookies.orderId).populate('items.pizzas')
    }
    prebuiltPizzas = await Pizza.find({type: "Prebuilt"})
    res.render('cart/index', { title: "Cart", order, prebuiltPizzas })
}

async function deleteItem(req, res) {
    const orderId = req.cookies.orderId
    const itemId = req.params.id
    await Pizza.findByIdAndDelete(itemId)
    const order = await Order.findById(orderId).populate('items.pizzas')
    order.total = calcTotal(order.items)
    order.save()
    res.render('cart/index', { title: "Cart", order })
}

async function editQuantity(req, res) {
    const orderId = req.cookies.orderId
    const itemId = req.params.id
    const newQty = parseInt(req.body.qty)
    
    const pizza = await Pizza.findById(itemId)
    if (!(pizza.quantity === 1 && newQty === -1)){
        pizza.quantity += newQty
        pizza.save()
    }
    const order = await Order.findById(orderId).populate('items.pizzas')
    order.total = calcTotal(order.items)
    order.save()
    res.render('cart/index', { title: "Cart", order })
}

async function checkout(req, res, next) {
    let orderId = req.cookies.orderId
    const order = await Order.findById(orderId).populate('items.pizzas')
    res.render('checkout/index', { title: "checkout", order })
}

async function handlePayment(req, res) {
    console.log(req.body)
    const orderId = req.params.id
    await Order.findOneAndUpdate(
        { _id: orderId },
        { $set: { status: "confirmed" } })
    const order = await Order.findById(orderId)
    res.clearCookie('orderId')
    res.render('order/status', {title: "Order Status", order})
}

function calcTotal(items){
    let tot = 0
    for (let pizza of items.pizzas){
        tot += pizza.price * pizza.quantity
    }
    return tot
}

function namePizza(pizza){
    let name = `${pizza.size}, ${pizza.crust} Crust, `
    if(pizza.meats && pizza.meats === "Ham" &&
        pizza.veggies && pizza.veggies === "Pineapple"){
        name += `Hawaiian`
    }else if(pizza.meats && pizza.meats === "Ham" &&
        pizza.veggies && pizza.veggies.includes("Pineapple")){
        name += `Hawaiian Specialty`
    }else if (pizza.meats && pizza.meats === "Pepperoni" && pizza.veggies){
        name += `Pepperoni Specialty`
    }else if(pizza.meats && pizza.meats === "Chicken" && pizza.sauce === "BBQ" && !pizza.veggies){
        name += `BBQ Chicken`
    }else if(pizza.meats && pizza.meats === "Chicken" && pizza.sauce === "Buffalo" && !pizza.veggies){
        name += `Buffalo Chicken`
    }else if(pizza.meats && pizza.meats === "Chicken" && pizza.sauce === "BBQ"){
        name += `BBQ Chicken Specialty`
    }else if(pizza.meats && pizza.meats === "Chicken" && pizza.sauce === "Buffalo"){
        name += `Buffalo Chicken Specialty`
    }else if (pizza.meats && pizza.meats.constructor !== String && !pizza.veggies ||
        (pizza.meats && pizza.meats.constructor !== String && pizza.veggies && pizza.veggies.constructor === String)){
        name += `Meat Lover`    
    }else if (pizza.meats && pizza.meats.constructor !== String && pizza.meats.length >= 3 &&
        pizza.veggies && pizza.veggies.constructor !== String && pizza.veggies.length >= 3){
        name += `The Works`
    }else if(pizza.meats && pizza.meats.constructor !== String && pizza.meats.length >= 2 &&
        pizza.veggies && pizza.veggies.constructor !== String && pizza.veggies.length >= 2){
        name += `The Supreme`
    }else if (pizza.meats && pizza.meats.constructor === String){
        name += `${pizza.meats}`
    }else if (pizza.veggies && pizza.veggies.constructor === String){
        name += `${pizza.veggies}`
    }else if (pizza.veggies && pizza.veggies.constructor !== String){
        name += `Veggie Lover`
    }else if (pizza.sauce === "Marinara" && pizza.cheese !== "No" && !pizza.meats && !pizza.veggies){
        name += `${pizza.cheese} Cheese Margherita`
    }else {
        name += `${pizza.cheese} Cheese`
    }
    name += ` Pizza`
    return name
}

function pricePizza(pizza){
    let price = 10
    let toppingCost = 1
    if (pizza.cheese === "Extra"){
        price += toppingCost
    }else if (pizza.cheese === "No"){
        price -= toppingCost
    }
    if (pizza.size === "Large"){
        price += toppingCost
    }else if (pizza.size === "Small"){
        price -=  toppingCost
    }
    if (pizza.meats){
        if(pizza.meats.constructor === String){
        price += toppingCost
        }else {
        price += toppingCost * pizza.meats.length
        }
    }
    if (pizza.veggies){
        if(pizza.veggies.constructor === String){
        price += toppingCost
        }else {
        price += toppingCost * pizza.veggies.length
        }
    }
    return price
}