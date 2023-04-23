const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");
let database;
const app = express();
app.use(express.json());

const initializationDBAndServer = async (request, response) => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running At localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error is ${e.message}`);
    process.exit(1);
  }
};
initializationDBAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const outputResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data;
  let getTodosQuery;
  const { search_q = "", status, priority, category, dueDate } = request.query;

  switch (true) {
    /*----------Scenario 3 has Priority and status ----------------*/
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    /**-------------Scenario 5 has only Category and Status---------------- */
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM  todo WHERE category = '${category}' AND status = '${status}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    /**-------------Scenario 7 has Category and Priority ---------------*/
    case hasCategoryAndPriorityProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}' ;`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachItem) => outputResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.send("Invalid Todo Category");
      }
      break;
    /**-------------Scenario 1 has only Status-------------*/
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    /**-------------Scenario 2 has only priority-------------*/
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    /**-------------Scenario 4 has only Search-------------*/
    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo like '%${search_q}%';`;
      data = await database.all(getTodosQuery);
      response.send(data.map((eachItem) => outputResult(eachItem)));
      break;
    /**-------------Scenario 6 has only Category-------------*/
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachItem) => outputResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `SELECT * FROM todo;`;
      data = await database.all(getTodosQuery);
      response.send(data.map((eachItem) => outputResult(eachItem)));
  }
});

// API 2 GET Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const responseResult = await database.get(getTodoQuery);
  response.send(outputResult(responseResult));
});

// API 3 Returns a list of all todos with a specific due date in the query parameter.
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //   console.log(isMatch(date, "yyyy-MM-dd"));
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    console.log(newDate);
    const getTodoQuery = ` SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const responseData = await database.all(getTodoQuery);
    response.send(responseData.map((eachItem) => outputResult(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4 Create a todo in the todo table.
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
                INSERT INTO todo(id, todo, priority, status, category, due_date )
                VALUES(
                    ${id},
                    '${todo}',
                    '${priority}',
                    '${status}',
                    '${category}',
                    '${dueDate}'
                    );`;
          await database.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});
// API 5 Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  switch (true) {
    /**---------Update Status----------- */
    case requestBody.status !== undefined:
      if (
        requestBody.status === "TO DO" ||
        requestBody.status === "IN PROGRESS" ||
        requestBody.status === "DONE"
      ) {
        const updateTodoStatus = `UPDATE todo SET status = "${requestBody.status}" WHERE id = ${todoId};`;
        const statusResponse = await database.run(updateTodoStatus);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    /**---------- update Priority---------- */
    case requestBody.priority !== undefined:
      console.log(requestBody.priority);
      if (
        requestBody.priority === "LOW" ||
        requestBody.priority === "MEDIUM" ||
        requestBody.priority === "HIGH"
      ) {
        const updateTodoPriority = `UPDATE todo SET priority = '${requestBody.priority}' WHERE id = ${todoId};`;
        const changePriority = await database.run(updateTodoPriority);
        response.send("Priority Updated");
      } else {
        response.status(400);
        return response.send("Invalid Todo Priority");
      }
      break;
    /**---------- update todo ------------------- */
    case requestBody.todo !== undefined:
      const updateTodoTodo = `UPDATE todo SET todo = '${requestBody.todo} WHERE id = ${todoId}';`;
      const changeTodo = await database.run(updateTodoTodo);
      response.send("Todo Updated");
      break;
    /**------------ Update Category --------------- */
    case requestBody.category !== undefined:
      if (
        requestBody.category === "WORK" ||
        requestBody.category === "HOME" ||
        requestBody.category === "LEARNING"
      ) {
        const updateTodoCategory = `UPDATE todo SET category = '${requestBody.category}' WHERE id = ${todoId};`;
        const changeCategory = await database.run(updateTodoCategory);
        response.send("Category Updated");
      } else {
        response.status(400);
        return response.send("Invalid Todo Category");
      }
      break;
    /*------------------ Update DueDate -----------*/
    case requestBody.dueDate !== undefined:
      if (isMatch(requestBody.dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(requestBody.dueDate), "yyyy-MM-dd");
        const updateTodoDueDate = `UPDATE todo SET due_date = '${requestBody.dueDate}' WHERE id = ${todoId};`;
        const changeDueDate = await database.run(updateTodoDueDate);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

// API 6 Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
