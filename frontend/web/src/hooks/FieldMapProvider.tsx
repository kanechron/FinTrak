import React, { createContext, useContext, useState, useEffect } from 'react'
import { getRuleFieldmap, type FieldMap, type RuleFieldMapDto, type TargetType } from '../api/rules'

const FieldMapContext = createContext<FieldMap | null>(null)


//Used inline props instead of 'interface Props {...}'
export const FieldMapProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [fieldMap, setFieldMap] = useState<FieldMap | null>(null)


    //Include the dependency array at the end to make sure this effect runs only once. Without [], useEffect will rerun EVERY render, which would cause an infinite loop. 
    useEffect(() => {
        getRuleFieldmap().then(setFieldMap)
    }, [])

    return (
        <FieldMapContext.Provider value={fieldMap}>
            {children}
        </FieldMapContext.Provider>
    )
} 

export function useFieldMap(key: TargetType): RuleFieldMapDto | null | undefined {
    const ctx = useContext(FieldMapContext)
    return ctx?.[key]
}