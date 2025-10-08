import {Dispatch, SetStateAction, useState} from "react";
import {Dialog, Flex} from "@radix-ui/themes";
import {Label} from "@/components/label.tsx";
import {Button} from "@/components/button.tsx";
import {Input} from "@/components/input.tsx";

export interface AddTagModalProps {
    to?: string[]
    addTo: Dispatch<SetStateAction<string[]>>
    label: string
    placeholder?: string
}

export default function BoxAddToModal({label, placeholder, to, addTo}: AddTagModalProps) {
    const [tmp, setTmp] = useState<string>()
    return <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
        <Flex direction="column">
            <Label className="text-sm font-medium">{label}</Label>
            {to?.length > 0 ? <Label className="text-sm font-medium">{to?.join(" ")}</Label> : ""}
            {(to?.length == 0 && placeholder) ?
                <Label className="text-sm font-medium text-muted-foreground  leading-relaxed">{placeholder}</Label> : ""}

            <Dialog.Root>
                <Dialog.Trigger>
                    <Button>Add {label}</Button>
                </Dialog.Trigger>
                <Dialog.Content>
                    <Dialog.Title>Add {label}</Dialog.Title>
                    <Input
                        onChange={e => {
                            setTmp(e.target.value)
                        }}
                        placeholder={placeholder}
                        className="text-sm"
                    />

                    <Dialog.Close>
                        <Button
                            onClick={() => {
                            if (tmp) {
                                addTo((prev) => {
                                    prev.push(tmp)
                                    return prev
                                })
                                setTmp(undefined)
                            }
                        }}>
                            Add
                        </Button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Root>
        </Flex>
    </div>
}

