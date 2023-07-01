//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/todolistDB",{useNewUrlParser:true});

const itemsSchema={
  name:String
};

const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
  name:"Hit the + button to aff a new item."
});

const item2=new Item({
  name:"Welcome to your todolist!"
});

const item3=new Item({
  name:"<-- Hit this to delete an item."
});

const defaultItems=[item1,item2,item3];

const listSchema={
  name:String,
  items:[itemsSchema]
};

const List=mongoose.model("List",listSchema);

async function getItems(){

  const Items = await Item.find({});
  return Items;

}

app.get("/", function(req, res) {

  getItems().then(function(foundItems){

    if(foundItems.length===0){
      Item.insertMany(defaultItems)
.then(function () {
        console.log("Successfully saved defult items to DB");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
   

  });
});

app.get("/:customListName",function(req,res){

const customListName=_.capitalize(req.params.customListName);
      

List.findOne({ name: customListName }).exec()
  .then(foundList => {
    if (!foundList) {
      const list=new List({
  name:customListName,
  items:defaultItems
});
list.save();
res.redirect("/"+customListName);
    } else {
      res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch(err => {
    console.log("An error occurred:", err);
  });




});



app.post("/", function(req, res){

  const itemName = req.body.newItem;
const listName=req.body.list;

const item=new Item({
  name:itemName
});
if(listName==="Today"){
 item.save();

res.redirect("/"); 
}
else{
 List.findOne({ name: listName }).exec()
  .then(foundList => {
     foundList.items.push(item);
     foundList.save();
     res.redirect("/"+listName);
  })
  .catch(err => {
    console.log("An error occurred:", err);
  });

}

  
});

app.post("/delete",function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;
  if(listName==="Today")
  {
    Item.findByIdAndRemove(checkedItemId)
.then(function (checkedItemId) {
  console.log(checkedItemId);
  res.redirect("/");
})
.catch(function (err) {
  console.log(err);
});
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then(function (foundList) {
  //console.log(checkedItemId);
  res.redirect("/"+listName);
})
.catch(function (err) {
  console.log(err);
});
  }




});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
