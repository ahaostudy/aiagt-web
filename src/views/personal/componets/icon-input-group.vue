<script setup lang="ts">
import InputGroup from '@c/input-group/input-group.vue'
import { FileItem } from '@arco-design/web-vue'
import { uploadAssetsAPI } from '@/api/assets'
import { vModelEmits, vModelPropsObj } from '@/utils/model_value.ts'
import { computed, ref, watch } from 'vue'
import { asset } from '@/models/assets'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  imageSize: {
    type: String,
    default: '5rem'
  },
  alt: {
    type: String,
    default: ''
  },
  innerClass: {
    type: String,
    default: ''
  },
  ...vModelPropsObj()
})
const emits = defineEmits(vModelEmits())

const fileURL = ref(props.modelValue)
const fileLocalURL = ref<string>()

const modelValue = computed(() => props.modelValue)

watch(modelValue, (newVal, oldVal) => {
  if (newVal === oldVal) return

  fileURL.value = modelValue.value
  fileLocalURL.value = asset(modelValue.value)
}, { immediate: true })

watch(fileURL, () => {
  emits('update:modelValue', fileURL)
  emits('change', fileURL)
})

async function upload(_: any, fileItem: FileItem) {
  if (!fileItem || !fileItem.file) return
  const resp = await uploadAssetsAPI(props.type, fileItem.file)

  fileURL.value = `${resp.file_path}`
  fileLocalURL.value = fileItem.url
}
</script>

<template>
  <input-group
    name="Icon"
    required
    direction="horizontal"
  >
    <div>
      <a-upload
        @change="upload"
        :show-file-list="false"
        :auto-upload="false"
        accept="image/png, image/jpeg, image/jpg, image/gif, image/webp, image/bmp, image/tiff, image/svg+xml, image/x-icon"
      >
        <template #upload-button>
          <div
            v-if="fileLocalURL"
            class="!m-0 arco-upload-list-picture custom-upload-avatar border !rounded-lg"
            :class="innerClass"
            :style="{width: imageSize, height: imageSize}"
          >
            <img :src="fileLocalURL" :alt="alt">
            <div
              class="arco-upload-list-picture-mask"
              :style="{lineHeight: `${imageSize} !important`}"
            >
              <icon-edit />
            </div>
          </div>
          <div v-else>
            <div
              class="flex justify-center items-center border border-gray-300 rounded-lg text-gray-500 hover:border-blue-700 hover:bg-gray-50 hover:text-blue-700 active:bg-gray-200 transition duration-300"
              :class="innerClass"
              :style="{width: imageSize, height: imageSize}"
            >
              <icon-upload />
            </div>
          </div>
        </template>
      </a-upload>
    </div>
  </input-group>
</template>