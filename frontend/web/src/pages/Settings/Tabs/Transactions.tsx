import { useEffect, useState } from "react"
import RulesBlock from "../../../components/common/RulesBlock"
import { 
  getRulesByTarget, 
  addRule,
type Rule, 
type TargetType} from "../../../api/rules"



export default function Transactions()  {
  return (
    <RulesBlock target="Transaction"/>
  )
}
