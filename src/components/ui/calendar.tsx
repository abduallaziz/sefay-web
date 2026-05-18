"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-white cursor-pointer",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 top-0 h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#1e2130]"
        ),
        button_next: cn(
          "absolute right-1 top-0 h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-[#1e2130]"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-gray-500 rounded-md w-8 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm",
        day_button: cn(
          "h-8 w-8 p-0 font-normal rounded-md text-white hover:bg-[#1e2130] aria-selected:opacity-100",
          "data-[selected]:bg-blue-600 data-[selected]:text-white data-[selected]:hover:bg-blue-700",
          "data-[today]:bg-[#1e2130] data-[today]:text-white",
          "data-[outside]:text-gray-600 data-[outside]:opacity-50",
          "data-[disabled]:text-gray-600 data-[disabled]:opacity-50"
        ),
        selected: "bg-blue-600 text-white rounded-md",
        today: "bg-[#1e2130] text-white rounded-md",
        outside: "text-gray-600 opacity-50",
        disabled: "text-gray-600 opacity-50",
        hidden: "invisible",
        dropdowns: "flex gap-2 items-center justify-center",
        dropdown: "bg-[#0f1117] border-2 border-[#3b82f6] text-white text-sm rounded-md px-2 py-1 cursor-pointer focus:outline-none",
        dropdown_root: "relative",
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }