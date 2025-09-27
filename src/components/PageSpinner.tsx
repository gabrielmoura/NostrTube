import {Spinner} from "@radix-ui/themes";

export function PageSpinner() {
    return (
        <div className="shadow-2xl justify-center flex">
            <Spinner size='3' />
        </div>
    )
}