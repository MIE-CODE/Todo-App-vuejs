<template>
  <div
    class="w-[100%] min-h-screen bg-gradient-to-br from-slate-300 to-slate-900 px-3 md:px-5 pb-10"
  >
    <Header :counter="count" />
    <Main @taskAdded="taskAdded"></Main>
  </div>
</template>

<script>
import Header from "./Header.vue";
import Main from "./Main.vue";

export default {
  name: "App",
  components: { Header, Main },
  data() {
    return {
      taskNumber: null,
      count: null,
    };
  },
  methods: {
    taskAdded(index) {
      this.taskNumber = index;
      this.count = index;
    },
  },
  // setup(index) {
  //   console.log(index);
  // },
};
</script>

<style></style>
