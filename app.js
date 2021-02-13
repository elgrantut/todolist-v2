//jshint esversion:6

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

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

// Item.deleteOne({ name: 'test' }, (err) => {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log('success!')
//   }
// })

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
  const listName = req.params.listName

  List.findOne({ name: listName }, (err, results) => {
    if (err) {
      console.log(err)
    } else if (!listName) {
      const list = new List({
        name: listName,
        items: defaultItems,
      })
      list.save()
    } else {
      res.render('list', {
        listTitle: results.name,
        newListItems: results.items,
      })
    }
  })
})

// Add items to the list

app.post('/', function (req, res) {
  const itemName = new Item({
    name: req.body.newItem,
  })
  if (req.body.list === 'Work') {
    itemName.save()
    res.redirect('/work')
  } else {
    itemName.save()
    res.redirect('/')
  }
})

app.post('/delete', (req, res) => {
  const id = req.body.delCheckbox
  Item.findByIdAndRemove(id, (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('success! You have deleted a list item')
      res.redirect('/')
    }
  })
})

// Go to About page

app.get('/about', (req, res) => {
  res.render('about')
})

// Listens to port 3000

app.listen(3000, () => console.log('Server started on port 3000'))
