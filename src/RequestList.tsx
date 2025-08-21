import React from 'react'
import { Request, isChromeRequest } from "./types"
import { CAR} from "@ucanto/core"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { isCarRequest, messageFromRequest, getRequestTiming, formatTiming } from "./util";
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DownloadIcon from '@mui/icons-material/Download';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

function binaryStringToUint8Array(bStr : string) {
  const u8_array = new Uint8Array(bStr.length);
  for (let i = 0; i < bStr.length; i++) {
    u8_array[i] = bStr.charCodeAt(i);
  }
  return u8_array;
}

function base64ToUint8Array(b64 : string) {
  const binary = atob(b64)
  return binaryStringToUint8Array(binary)
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: CAR.contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function filenameFromUrl(urlStr: string, suffix: string) {
  try {
    const url = new URL(urlStr)
    const base = (url.hostname + url.pathname).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'request'
    return `${base}-${suffix}.car`
  } catch {
    const base = urlStr.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 80) || 'request'
    return `${base}-${suffix}.car`
  }
}

async function getRequestBodyBytes(req: Request): Promise<Uint8Array | null> {
  // Prefer HAR-style body if available
  const anyReq: any = req as any
  const postData = anyReq?.request?.postData
  if (postData?.text) {
    if (postData.encoding === 'base64') {
      return base64ToUint8Array(postData.text)
    }
    return binaryStringToUint8Array(postData.text)
  }
  return null
}

async function getResponseBodyBytes(req: Request): Promise<Uint8Array | null> {
  const anyReq: any = req as any
  // HAR response content if present
  const harText: string | undefined = anyReq?.response?.content?.text
  const harEncoding: string | undefined = anyReq?.response?.content?.encoding
  if (harText) {
    if (harEncoding === 'base64') {
      return base64ToUint8Array(harText)
    }
    return binaryStringToUint8Array(harText)
  }
  // Fallback to devtools getContent for live requests
  if (isChromeRequest(req)) {
    return new Promise((resolve) => {
      req.getContent((content, encoding) => {
        if (!content) return resolve(null)
        if (encoding === 'base64') return resolve(base64ToUint8Array(content))
        resolve(binaryStringToUint8Array(content))
      })
    })
  }
  return null
}

function DownloadMenu({ request }: { request: Request }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const hasRequestBody = Boolean((request as any)?.request?.postData?.text)

  const onOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }
  const onClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setAnchorEl(null)
  }

  const onDownload = async (e: React.MouseEvent, which: 'request' | 'response') => {
    e.stopPropagation()
    const bytes = which === 'request' ? await getRequestBodyBytes(request) : await getResponseBodyBytes(request)
    if (!bytes) return onClose()
    downloadBytes(bytes, filenameFromUrl(request.request.url, which))
    onClose()
  }

  return (
    <>
      <Tooltip title="Save CARs">
        <IconButton size="small" onClick={onOpen} aria-label="save-cars">
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={() => onClose()} onClick={(e) => e.stopPropagation()}>
        <MenuItem onClick={(e) => onDownload(e, 'request')} disabled={!hasRequestBody}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Request CAR</ListItemText>
        </MenuItem>
        <MenuItem onClick={(e) => onDownload(e, 'response')}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Response CAR</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

function RequestEntry({ request, selectedRequest, selectRequest } : {request: Request, selectedRequest: Request | null, selectRequest: (request: Request) => void}) {
  const message = messageFromRequest(request)
  const timing = getRequestTiming(request)
  const formattedTiming = formatTiming(timing)
  
  return (
    <TableRow onClick={() => selectRequest(request)} hover selected={request === selectedRequest}>
      <TableCell>{request.request.url}</TableCell>
      <TableCell>{ typeof message === 'string' ? message : message.invocations.flatMap((invocation) => invocation.capabilities.map((capability => capability.can))).join(", ")}</TableCell>
      <TableCell>{formattedTiming}</TableCell>
      <TableCell align="right" width={72}>
        <DownloadMenu request={request} />
      </TableCell>
    </TableRow>
  )
}

function RequestList({ requests, selectedRequest, selectRequest } : { requests: Request[], selectedRequest: Request | null, selectRequest: (request: Request) => void }) {
  const defaultChecked = JSON.parse(localStorage.getItem('persistOnReload') || 'false')

  const handlePersistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    localStorage.setItem('persistOnReload', JSON.stringify(e.target.checked))
  }

  const requestItems = requests.filter(isCarRequest).map((request, idx) => <RequestEntry key={`${request.request.url}-${idx}`} selectedRequest={selectedRequest} selectRequest={selectRequest} request={request} />)
  return (
    <TableContainer sx={{height: "100%", overflowY: "scroll"}}>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1 }}>
      <FormControlLabel
        control={<Switch defaultChecked={defaultChecked} onChange={handlePersistChange} />}
        label="Persist across reloads"
      />
    </Box>
    <Table
      stickyHeader
      aria-labelledby="tableTitle"
      size={'medium'}
    >
      <TableHead>
        <TableCell>URL</TableCell>
        <TableCell>Capabilities</TableCell>
        <TableCell><abbr title="Round Trip Time">RTT</abbr></TableCell>
        <TableCell align="right">Save</TableCell>
      </TableHead>
      <TableBody>
      { requestItems }
      </TableBody>
    </Table>
    </TableContainer>
  )
}

export default RequestList