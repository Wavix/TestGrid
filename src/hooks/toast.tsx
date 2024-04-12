import { useToast } from "@chakra-ui/react"

export const useFailureToast = () => {
  const toast = useToast({ containerStyle: { marginRight: "12px" } })

  return (description: string) =>
    toast({
      duration: 4500,
      title: "Error",
      description: description || "Request failed",
      status: "error",
      colorScheme: "telegram",
      position: "top-right",
      isClosable: true
    })
}

export const useSuccessToast = () => {
  const toast = useToast({ containerStyle: { marginRight: "12px" } })

  return (description: string) =>
    toast({
      duration: 4500,
      title: "Success",
      status: "success",
      position: "top-right",
      isClosable: true,
      colorScheme: "telegram",
      description: description || "Success"
    })
}
