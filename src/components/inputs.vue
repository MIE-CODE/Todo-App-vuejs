<template>
  <div class="container mx-auto mt-8">
    <h1 class="text-2xl font-semibold mb-4">Vue.js To-Do App</h1>

    <div class="flex mb-4">
      <input
        v-model="newTask"
        @keyup.enter="addTask"
        type="text"
        class="border rounded-l px-2 py-1 w-full"
        placeholder="Add a new task"
      />
      <button
        @click="addTask"
        class="bg-blue-500 text-white px-4 py-1 rounded-r"
      >
        Add
      </button>
    </div>

    <ul>
      <li
        v-for="(task, index) in tasks"
        :key="index"
        class="flex items-center mb-2"
      >
        <input type="checkbox" v-model="task.completed" class="mr-2" />
        <span :class="{ 'line-through': task.completed }">{{ task.text }}</span>
        <button @click="deleteTask(index)" class="ml-auto text-red-500">
          Delete
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "INput",
  data() {
    return {
      newTask: "",
      tasks: [],
    };
  },
  methods: {
    addTask() {
      if (this.newTask.trim() !== "") {
        this.tasks.push({ text: this.newTask, completed: false });
        this.newTask = ""; // Clear the input after adding a task
      }
    },
    completeTask(index) {
      this.tasks[index].completed = true;
    },
    deleteTask(index) {
      this.tasks.splice(index, 1);
    },
  },
};
</script>

<style></style>
