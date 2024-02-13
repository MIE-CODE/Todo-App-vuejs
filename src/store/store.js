import { createStore } from "vuex";

export const store = createStore({
  state: {
    todos: [],
  },

  mutations: {
    addTodo(state, newTask) {
      state.todos.unshift({
        text: newTask,
        id: Math.random(),
        isReadonly: true,

        checkBox: false,
      });
      var taskLength = state.todos.length;
      return taskLength;
    },

    finishedTask(state, id) {
      state.todos = state.todos.map((todo) => {
        if (id == todo.id) {
          todo.checkBox = !todo.checkBox;
        }
        return todo;
      });
    },

    deleteTodo(state, id) {
      state.todos = state.todos.filter((todo) => todo.id !== id);
    },
    editTask(state, id) {
      state.todos = state.todos.map((todo) => {
        if (id == todo.id) {
          todo.isReadonly = !todo.isReadonly;
        }
        return todo;
      });
    },
  },
  getters: {
    taskLength: (state) => {
      var taskLength = state.todos.length;
      return taskLength;
    },
  },
});
