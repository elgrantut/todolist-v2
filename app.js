//jshint esversion:6

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const { capitalize } = require('lodash')

const app = express()

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

// Connect to DB

mongoose.connect('mongodb://localhost:27017/todoListDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

mongoose.set('useFindAndModify', false)

// Schemas

const itemsSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'No names are specified!'] },
})

const Item = mongoose.model('item', itemsSchema)

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
})

const List = mongoose.model('list', listSchema)

// Initial Items

const item1 = new Item({
  name: 'Welcome to this to do List!',
})

const item2 = new Item({
  name: 'Hit the + button to add a new item.',
})

const item3 = new Item({
  name: '<----Hit this to delete an item',
})

const defaultItems = [item1, item2, item3]

app.get('/', (req, res) => {
  Item.find({}, (err, results) => {
    if (err) {
      console.log(err)
    } else if (results.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log('Success!')
        }
        res.redirect('/')
      })
    } else {
      res.render('list', { listTitle: 'Today', newListItems: results })
    }
  })
})

// Create a dinamic page category

app.get('/:listName', (req, res) => {
  const listName = capitalize(req.params.listName)

  List.findOne({ name: listName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: listName,
          items: defaultItems,
        })
        list.save((err, result) => {
          res.redirect('/' + listName)
        })
      } else {
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items,
        })
      }
    }
  })
})

// Add items to the list

app.post('/', function (req, res) {
  //Capture the names values of the list && the items

  const itemName = req.body.newItem
  const listName = req.body.list

  //Create a new item

  const item = new Item({
    name: itemName,
  })

  //Add´s a new item to the list

  if (listName === 'Today') {
    item.save((err, result) => res.redirect('/'))
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item)
      foundList.save((err, result) => res.redirect('/' + listName))
    })
  }
})

app.post('/delete', (req, res) => {
  //Capture values from the checkbox && the list title
  const id = req.body.delCheckbox
  const listName = req.body.listName

  if (listName === 'Today') {
    // Remove an item from the list
    Item.findByIdAndRemove(id, (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log('success! You have deleted a list item')
        res.redirect('/')
      }
    })
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: id } } },
      (err, foundList) => {
        if (!err) {
          res.redirect('/' + listName)
        }
      }
    )
  }
})

// Go to About page

app.get('/about', (req, res) => {
  res.render('about')
})

// Listens to port 3000

app.listen(3000, () => console.log('Server started on port 3000'))
