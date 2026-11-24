import { createToaster, Portal, Stack, Toast, Toaster as ChakraToaster } from "@chakra-ui/react"

const TOAST_DURATION_MS = 4500

const toaster = createToaster({ placement: "top-end" })

export const Toaster = () => (
  <Portal>
    <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
      {toast => (
        <Toast.Root width={{ md: "sm" }}>
          <Toast.Indicator />
          <Stack gap="1" flex="1" maxWidth="100%">
            {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
            {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
          </Stack>
          {toast.closable && <Toast.CloseTrigger />}
        </Toast.Root>
      )}
    </ChakraToaster>
  </Portal>
)

export const useFailureToast = () => (description: string) =>
  toaster.create({
    duration: TOAST_DURATION_MS,
    title: "Error",
    description: description || "Request failed",
    type: "error",
    closable: true
  })

export const useSuccessToast = () => (description: string) =>
  toaster.create({
    duration: TOAST_DURATION_MS,
    title: "Success",
    description: description || "Success",
    type: "success",
    closable: true
  })
