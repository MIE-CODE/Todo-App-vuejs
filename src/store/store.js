import { createStore } from "vuex";

export const store = createStore({
  state: {
    todos: [
      {
        text: "make tea",
        id: 0,
        isReadonly: true,
        disabled: "opacity-60",
      },
      {
        text: "sleep",
        id: 1,
        isReadonly: true,
        disabled: "opacity-60",
      },
    ],
  },

  mutations: {
    addTodo(state, newTask) {
      state.todos.unshift({
        text: newTask,
        id: Math.random(),
        isReadonly: true,

        checkBox: false,
      });
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
