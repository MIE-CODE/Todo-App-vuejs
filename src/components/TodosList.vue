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
            :class="
              todo.checkBox
                ? 'opacity-60 cursor-not-allowed transition duration-300'
                : 'opacity-100  transition duration-200'
            "
            class="bg-slate-500 rounded-lg flex justify-between px-5 py-2 md:py-3"
            v-for="todo in todos"
            :key="todo.id"
          >
            <div class="flex items-center gap-4 w-[80%]">
              <input
                v-model="todo.checkBox"
                @click="finsishedTask(id)"
                type="checkbox"
                class="text-pink-500 w-4 h-4 rounded-[50%] appearance-none hover:ring-gray-400 ring-gray-300 ring checked:bg-slate-600 focus:outline-none transition duration-150"
              />
              <input
                class="bg-transparent w-[60%] outline-none placeholder:text-[#def5de] text-[#def5de] read-only:text-[#ebefeb]"
                type="text"
                v-bind:focus="!todo.isReadonly"
                :placeholder="todo.text"
                :readonly="todo.isReadonly"
                @keypress.enter="editTask(todo.id)"
              />
            </div>

            <div class="flex gap-3">
              <button
                :disabled="todo.checkBox"
                class="text-[#dae8c9cc] hover:opacity-70 active:opacity-100 duration-200"
                @click="editTask(todo.id)"
              >
                {{ todo.isReadonly ? "Edit" : "Save" }}
              </button>
              <button
                @click="deleteTodo(todo.id)"
                class="text-[crimson] hover:opacity-70 active:opacity-100 transition duration-150"
              >
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
import { ref, computed } from "vue";
import { useStore } from "vuex";

export default {
  setup(props, { emit }) {
    const todos = computed(() => store.state.todos);
    const newTodo = ref("");
    const store = useStore();
    const checkBox = ref("");
    const addTodo = () => {
      if (newTodo.value.trim() !== "") {
        store.commit("addTodo", newTodo.value);
        newTodo.value = ""; // Clear input after adding task
      } else {
        emit("badValue");
      }
    };

    const finsishedTask = (id) => {
      store.commit("finishedTask", id);
    };

    const deleteTodo = (id) => {
      store.commit("deleteTodo", id);
      console.log(id);
    };

    const editTask = (id) => {
      console.log(id);
      store.commit("editTask", id);
    };

    return {
      todos,
      newTodo,
      checkBox,
      addTodo,
      deleteTodo,
      editTask,
      finsishedTask,
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
