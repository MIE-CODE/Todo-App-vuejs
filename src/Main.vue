<template>
  <div
    class="bg-slate-50 min-w-[290px] md:max-w-[700px] mx-[auto] my-[60px] rounded-xl shadow-lg shadow-stone-700"
  >
    <Transition name="erro">
      <ErroMessage v-if="showErro" />
    </Transition>
    <TodosList @badValue="triggerErro" />
  </div>
</template>

<script>
import { ref } from "vue";
import ErroMessage from "./components/ErroMessage.vue";
import TodosList from "./components/TodosList.vue";
export default {
  name: "MAin",
  components: { ErroMessage, TodosList },
  setup() {
    const showErro = ref(false);
    const triggerErro = () => {
      showErro.value = true;
      setTimeout(() => (showErro.value = false), 3000);
    };
    return { showErro, triggerErro };
  },
};
</script>
<style>
/* .lists--from {
  opacity: 0;
  transform: scale(0.6);
}
.lists-enter-to {
  opacity: 1;
  transform: scale(1);
} */
.erro-enter-active {
  animation: wobble 0.5s ease;
}
.erro-leave-from {
  opacity: 1;
  transform: scale(1);
}
.erro-leave-to {
  opacity: 0;
  transform: scale(0.6);
}
.erro-leave-active {
  transition: all 0.4s ease;
  position: absolute;
}
.lists-move {
  transition: all 0.3s ease;
}
@keyframes wobble {
  0% {
    transform: translateY(-60px);
    opacity: 0;
  }
  50% {
    transform: translateY(0px);
    opacity: 1;
  }
  60% {
    transform: translateX(8px);
  }
  70% {
    transform: translateX(-8px);
  }
  80% {
    transform: translateX(4px);
  }
  90% {
    transform: translateX(-4px);
  }
  100% {
    transform: translate(0px);
  }
}
</style>
