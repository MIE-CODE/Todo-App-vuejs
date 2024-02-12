<template>
  <div>
    <div class="w-fit mx-auto pt-16 relative select-none">
      <h1
        class="flex justify-center items-center gap-3 text-4xl md:text-5xl font-bold font-['Roboto Slab'] text-stone-900/80"
      >
        To-Do <span class="text-yellow-400">|| App</span>
        <img class="w-10 h-10" src="./assets/Todo-list.png" :alt="tittle" />
        <span
          class="bg-red-200 absolute text-xs font-extrabold text-center rounded-[50%] px-1 text-stone-700 right-0 top-[60px]"
          >{{ counter }} 0</span
        >
      </h1>
    </div>
  </div>
</template>

<script>
export default {
  name: "HeaDer",
  props: ["counter"],

  data() {
    return {
      tittle: "hello",
      src: "../assets/Todo-list.png",
    };
  },
  methods: {},
};
</script>

<style></style>
