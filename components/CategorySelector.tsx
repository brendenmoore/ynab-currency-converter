import { useState, Fragment } from 'react'
import { Combobox } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/solid'

const people = [
    { id: 1, name: 'Durward Reynolds' },
    { id: 2, name: 'Kenton Towne' },
    { id: 3, name: 'Therese Wunsch' },
    { id: 4, name: 'Benedict Kessler' },
    { id: 5, name: 'Katelyn Rohan' },
]

export function CategorySelector() {
    const [selectedPerson, setSelectedPerson] = useState(people[0])
    const [query, setQuery] = useState('')

    const filteredPeople =
        query === ''
            ? people
            : people.filter((person) => {
                return person.name.toLowerCase().includes(query.toLowerCase())
            })

    return (
        <Combobox value={selectedPerson} onChange={setSelectedPerson}>
            <Combobox.Input
                onChange={(event) => setQuery(event.target.value)}
                displayValue={(person: {id: number, name: string}) => person.name}
            />
            <Combobox.Options>
                {filteredPeople.map((person) => (
                    /* Use the `active` state to conditionally style the active option. */
                    /* Use the `selected` state to conditionally style the selected option. */
                    <Combobox.Option key={person.id} value={person} as={Fragment}>
                        {({ active, selected }) => (
                            <li
                                className={`${active ? 'bg-blue-500 text-white' : 'bg-white text-black'
                                    }`}
                            >
                                {selected && <CheckIcon />}
                                {person.name}
                            </li>
                        )}
                    </Combobox.Option>
                ))}
            </Combobox.Options>
        </Combobox>
    )
}