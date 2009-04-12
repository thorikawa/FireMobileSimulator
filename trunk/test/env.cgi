#!/usr/bin/perl
use strict;

print "Content-type: text/html\n\n";

print "<html>\n";
print "<head><title>CGI Environment</title></head>\n";
print "<body>\n";


print "<h1>CGI 環境変数リスト</h1>\n";
print "<hr>";

foreach my $env_name (sort(keys(%ENV))) {
	my $value = $ENV{ $env_name };
	print "$env_name = $value <br> \n";
}

my $data;
read (STDIN, $data, $ENV{'CONTENT_LENGTH'});
print "POST data = $data <br> \n";

print "</body>\n";
print "</html>\n";
