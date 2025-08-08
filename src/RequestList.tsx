import { Request } from "./types"
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { isCarRequest, messageFromRequest } from "./util";
function RequestEntry({ request, selectedRequest, selectRequest } : {request: Request, selectedRequest: Request | null, selectRequest: (request: Request) => void}) {
  const message = messageFromRequest(request)
  return (
    <TableRow onClick={() => selectRequest(request)} hover selected={request === selectedRequest}>
      <TableCell>{request.request.url}</TableCell>
      <TableCell>{ typeof message === 'string' ? message : message.invocations.flatMap((invocation) => invocation.capabilities.map((capability => capability.can))).join(", ")}</TableCell>
    </TableRow>
  )
}

function RequestList({ requests, selectedRequest, selectRequest, persistOnReload, setPersistOnReload} : { requests: Request[], selectedRequest: Request | null, selectRequest: (request: Request) => void, persistOnReload: boolean, setPersistOnReload: (value:boolean) => void }) {
  const requestItems = requests.filter(isCarRequest).map(request => <RequestEntry selectedRequest={selectedRequest} selectRequest={selectRequest} request={request} />)
  return (
    <TableContainer sx={{height: "100%", overflowY: "scroll"}}>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1 }}>
      <FormControlLabel
        control={<Switch checked={persistOnReload} onChange={(e) => setPersistOnReload(e.target.checked)} />}
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
      </TableHead>
      <TableBody>
      { requestItems }
      </TableBody>
    </Table>
    </TableContainer>
  )
}

export default RequestList