<template>
  <div
    class="w-[100%] min-h-screen bg-gradient-to-br from-slate-300 to-slate-900 px-3 md:px-5 pb-10"
  >
    <Header :counter="taskLength" />
    <Main @taskAdded="taskAdded"></Main>
  </div>
</template>

<script>
import Header from "./Header.vue";
import Main from "./Main.vue";
import { useStore } from "vuex";
import { computed } from "vue";

export default {
  name: "App",
  components: { Header, Main },

  setup() {
    const store = useStore();
    const count = computed(() => {
      return store.getters.taskLength;
    });
    const taskLength = count.value;

    console.log(count.value);

    return { taskLength };
  },
};
</script>

<style></style>
