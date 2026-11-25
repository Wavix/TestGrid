import { createToaster, Portal, Stack, Toast, Toaster as ChakraToaster } from "@chakra-ui/react"

const TOAST_DURATION_MS = 4500

const toaster = createToaster({ placement: "top-end" })

const tintedToast = (accent: string) => ({
  "background": `color-mix(in srgb, ${accent} 12%, var(--tg-card))`,
  "color": "var(--tg-foreground)",
  "border": `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
  "& [data-part=indicator]": { color: accent }
})

const toastColors = {
  "&[data-type=success]": tintedToast("var(--tg-success)"),
  "&[data-type=error]": tintedToast("var(--tg-danger)")
}

export const Toaster = () => (
  <Portal>
    <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
      {toast => (
        <Toast.Root width={{ md: "sm" }} css={toastColors}>
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
