import React, { useEffect, useState } from "react"

import { Button, Input } from "@chakra-ui/react"

import { parseBranchList } from "@/helpers/branch-list"
import { useFailureToast, useSuccessToast } from "@/hooks/toast"
import { getNamespaceSettings, updateNamespaceSettings } from "@/ui/api/admin"
import { Card } from "@/ui/components/layout"

import style from "./style.module.scss"

export const BookingFreeBranches = () => {
  const successToast = useSuccessToast()
  const failureToast = useFailureToast()

  const [value, setValue] = useState("")
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    getNamespaceSettings().then(response => {
      if (response.error || !response.settings) return failureToast(response.error)
      setValue(response.settings.booking_free_branches.join(", "))
    })
  }, [])

  const onSave = async () => {
    setSaving(true)
    const response = await updateNamespaceSettings({ booking_free_branches: parseBranchList(value) })
    setSaving(false)

    if (response.error || !response.settings) return failureToast(response.error)

    setValue(response.settings.booking_free_branches.join(", "))
    successToast("Saved")
  }

  return (
    <Card.Container>
      <Card.Header>Branches that deploy without booking</Card.Header>
      <p className={style.settingHint}>
        Comma-separated, e.g. main. A deploy from these branches does not book the service, but is still refused while
        another user has it booked.
      </p>
      <div className={style.settingRow}>
        <Input
          className={style.settingInput}
          value={value}
          placeholder="main"
          onChange={e => setValue(e.target.value)}
        />
        <Button unstyled className={style.resetButton} onClick={onSave} disabled={isSaving}>
          Save
        </Button>
      </div>
    </Card.Container>
  )
}
