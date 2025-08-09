import { AgentMessage} from "@ucanto/interface"
import { CAR, Message } from '@ucanto/core'
import { Request } from './types'

function convertBinaryStringToUint8Array(bStr : string) {
	const u8_array = new Uint8Array(bStr.length);
	for (let i = 0; i < bStr.length; i++) {
		u8_array[i] = bStr.charCodeAt(i);
	}
	return u8_array;
}


export function decodeMessage(bodyAsString : string) : AgentMessage | string {
  try {
    const body = convertBinaryStringToUint8Array(bodyAsString)
      const { roots, blocks } = CAR.decode(body)
      return Message.view({ root: roots[0].cid, store: blocks })
  } catch {
    return "Unable to decode CAR File"
  }
}

export function messageFromRequest(request : Request) : AgentMessage | string {
  if (!request.request.postData || !request.request.postData.text) {
    return ''
  }
  return decodeMessage(request.request.postData.text)
}

export const bigIntSafe = (_ : any, value : any) => typeof value === 'bigint' ? value.toString() : value

export const shortString = (st : string, n: number) => st.length > n ? st.substring(0, n) + '...' : st

export function isCarRequest(request : Request) {
  return request.request.headers.some((header) => header.name.toLowerCase() == 'content-type' && header.value == CAR.contentType)
}

export function formatError(error: any): string {
  try {
    return JSON.stringify(error, null, 2); // Format JSON with indentation
  } catch {
    return String(error); // Fallback for non-JSON errors
  }
}

export function getRequestStatus(request: Request): string {
  const httpStatus = request.response.status
  const isHttpSuccess = httpStatus >= 200 && httpStatus < 300
  const isHttpError = httpStatus >= 400

  const message = messageFromRequest(request)
  let hasReceiptError = false

  if (typeof message !== 'string' && message.receipts.size > 0) {
    for (const receipt of message.receipts.values()) {
      if (receipt.out.error !== undefined) {
        hasReceiptError = true
        break
      }
    }
  }

  if (isHttpError || hasReceiptError) {
    return 'error'
  } else if (isHttpSuccess && !hasReceiptError) {
    return 'success'
  } else {
    return 'pending'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return '#4caf50'
    case 'error':
      return '#f44336'
    case 'pending':
      return '#ff9800'
    default:
      return '#9e9e9e'
  }
}