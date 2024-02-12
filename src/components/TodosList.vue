<template>
  <div class="p-2 grid pb-3 gap-4">
    <div class="flex gap-0">
      <input
        placeholder="add your task..."
        class="text-[#5c3f4a] bg-stone-200 outline-none rounded-l-xl px-3 h-10 md:h-14 w-[80%] placeholder:text-lg"
        type="text"
        v-model="newTodo"
        @keypress.enter="addTodo"
      />
      <button
        @click="addTodo"
        class="w-[20%] bg-emerald-700 rounded-r-xl font-bold text-emerald-200 hover:text-emerald-100 hover:bg-opacity-90 active:bg-opacity-75 text-lg"
      >
        Add
      </button>
    </div>
    <div>
      <p class="text-lg font-bold text-[#6e6885]">Tasks :</p>
    </div>
    <transition name="switch" mode="out-in">
      <div v-if="todos.length">
        <transition-group class="grid gap-3" tag="ul" name="lists" appear>
          <li
            class="bg-slate-500 rounded-lg flex justify-between px-5 py-2 md:py-3"
            v-for="todo in todos"
            :key="todo.id"
          >
            <input
              class="bg-transparent w-[60%] outline-none text-green-200 read-only:text-gray-400"
              type="text"
              :placeholder="todo.text"
              :readonly="todo.isReadonly"
            />

            <div class="flex gap-3 text-[#dae8c9cc]">
              <button ref="edditor" @click="edditTask(todo.id)">
                {{ todo.isReadonly ? "Edit" : "Save" }}
              </button>
              <button @click="deleteTodo(todo.id)" class="text-[crimson]">
                delete
              </button>
            </div>
          </li>
        </transition-group>
      </div>

      <div class="mx-auto text-lg font-bold text-[#777172]" v-else>
        Nothing left todo...
      </div>
    </transition>
  </div>
</template>

<script>
import { ref } from "vue";
export default {
  setup(props, { emit }) {
    const todos = ref([
      { text: "make tea", id: 0, isReadonly: true },
      { text: "sleep", id: 1, isReadonly: true },
    ]);
    const newTodo = ref("");

    const addTodo = () => {
      if (newTodo.value) {
        const id = todos.value.length;
        todos.value = [
          { text: newTodo.value, id, isReadonly: true },
          ...todos.value,
        ];

        newTodo.value = "";
      } else {
        emit("badValue");
      }
    };

    const deleteTodo = (id) => {
      todos.value = todos.value.filter((todo) => todo.id !== id);
      console.log(id);
    };
    const isReadonly = ref(true);
    const edit = ref("Edit");

    const edditTask = (id) => {
      console.log(id);
      todos.value[id].isReadonly = !todos.value[id].isReadonly;
    };

    return {
      todos,
      newTodo,
      addTodo,
      deleteTodo,
      edditTask,
      edit,
      isReadonly,
    };
  },
};
</script>

<style>
.lists-enter-from {
  opacity: 0;
  transform: scale(0.6);
}
.lists-enter-to {
  opacity: 1;
  transform: scale(1);
}
.lists-enter-active {
  transition: all 0.4s ease;
}
.lists-leave-from {
  opacity: 1;
  transform: scale(1);
}
.lists-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
.lists-leave-active {
  transition: all 0.4s ease;
  position: absolute;
}
.lists-move {
  transition: all 0.3s ease;
}
.switch-enter-from,
.switch-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.switch-enter-to,
.switch-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.switch-leave-active,
.switch-enter-active {
  transition: all 0.5s ease;
}
</style>
